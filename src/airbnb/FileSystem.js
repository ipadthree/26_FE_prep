const ADMIN = "admin";

class CloudStorage {
    constructor() {
        /**
         * filename -> {
         *   size: number,
         *   owner: string
         * }
         */
        this.files = new Map();

        /**
         * userId -> {
         *   capacity: number,
         *   used: number,
         *   files: Set<string>
         * }
         */
        this.users = new Map();

        /**
         * userId -> Map<filename, size>
         *
         * Backup 是独立 snapshot。
         * 后续 delete / add / merge 都不会修改已有 snapshot。
         */
        this.backups = new Map();

        // Level 1 的 add_file 默认由 admin 创建。
        // admin 拥有无限容量，同时也支持 backup / restore。
        this.users.set(ADMIN, {
            capacity: Infinity,
            used: 0,
            files: new Set(),
        });
    }

    // ============================================================
    // Internal helpers
    // ============================================================

    /**
     * 把一个新文件挂到 user 名下。
     *
     * Preconditions:
     *   - filename 不存在
     *   - caller 已完成 capacity validation（如果需要）
     */
    _attach(userId, name, size) {
        const user = this.users.get(userId);

        this.files.set(name, {
            size,
            owner: userId,
        });

        user.files.add(name);
        user.used += size;
    }

    /**
     * 删除一个文件，并同步 owner 的反向索引和 used。
     *
     * @returns {number|null}
     */
    _detach(name) {
        const file = this.files.get(name);

        if (!file) {
            return null;
        }

        const owner = this.users.get(file.owner);

        // 根据系统 invariant，这里 owner 必须存在。
        owner.files.delete(name);
        owner.used -= file.size;

        this.files.delete(name);

        return file.size;
    }

    // ============================================================
    // Level 1
    // ============================================================

    /**
     * Adds a new file owned by admin.
     *
     * @returns {boolean}
     */
    add_file(name, size) {
        if (this.files.has(name)) {
            return false;
        }

        this._attach(ADMIN, name, size);

        return true;
    }

    /**
     * @returns {number|null}
     */
    get_file_size(name) {
        const file = this.files.get(name);

        return file ? file.size : null;
    }

    /**
     * @returns {number|null}
     */
    delete_file(name) {
        return this._detach(name);
    }

    // ============================================================
    // Level 2
    // ============================================================

    /**
     * Find files whose names start with prefix.
     *
     * Sort:
     *   1. size descending
     *   2. filename lexicographically ascending
     *
     * @returns {string[]}
     *
     * Example:
     * [
     *   "/file3(500)",
     *   "/file1(300)",
     *   "/file2(300)"
     * ]
     */
    get_n_largest(prefix, n) {
        const matched = [];

        for (const [name, file] of this.files) {
            if (name.startsWith(prefix)) {
                matched.push({
                    name,
                    size: file.size,
                });
            }
        }

        matched.sort((a, b) => {
            // larger size first
            if (a.size !== b.size) {
                return b.size - a.size;
            }

            // same size -> lexicographically smaller filename first
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;

            return 0;
        });

        return matched
            .slice(0, n)
            .map(({ name, size }) => `${name}(${size})`);
    }

    // ============================================================
    // Level 3
    // ============================================================

    /**
     * Add a normal user with limited capacity.
     *
     * @returns {boolean}
     */
    add_user(userId, capacity) {
        // also prevents add_user("admin", ...)
        if (this.users.has(userId)) {
            return false;
        }

        this.users.set(userId, {
            capacity,
            used: 0,
            files: new Set(),
        });

        return true;
    }

    /**
     * Add file owned by a specific user.
     *
     * Returns remaining capacity.
     *
     * @returns {number|null}
     */
    add_file_by(userId, name, size) {
        const user = this.users.get(userId);

        if (!user) {
            return null;
        }

        // filename is globally unique
        if (this.files.has(name)) {
            return null;
        }

        // admin has Infinity capacity, so this naturally passes.
        if (user.used + size > user.capacity) {
            return null;
        }

        this._attach(userId, name, size);

        return user.capacity - user.used;
    }

    /**
     * Merge userId2 INTO userId1.
     *
     * After merge:
     *
     * - user2's current files belong to user1
     * - user1 capacity += user2 capacity
     * - user1 used += user2 used
     * - user2 is deleted
     * - user2 backup is deleted
     * - IMPORTANT: user1's existing backup is NOT changed
     *
     * @returns {number|null}
     */
    merge_user(userId1, userId2) {
        if (userId1 === userId2) {
            return null;
        }

        const user1 = this.users.get(userId1);
        const user2 = this.users.get(userId2);

        if (!user1 || !user2) {
            return null;
        }

        // Problem guarantees merge isn't called on admin,
        // but keep the guard for safety.
        if (userId1 === ADMIN || userId2 === ADMIN) {
            return null;
        }

        /*
         * Transfer ownership.
         *
         * Do NOT use _detach + _attach here:
         * those helpers would unnecessarily alter used during transfer.
         *
         * We only need:
         *
         * user2.files -> user1.files
         * file.owner  -> userId1
         */
        for (const name of user2.files) {
            const file = this.files.get(name);

            file.owner = userId1;
            user1.files.add(name);
        }

        // Combine quota/accounting.
        user1.capacity += user2.capacity;
        user1.used += user2.used;

        /*
         * CRITICAL Level 4 rule:
         *
         * user1's previous backup stays EXACTLY the same.
         *
         * user2 disappears, therefore its backup disappears.
         */
        this.backups.delete(userId2);

        this.users.delete(userId2);

        return user1.capacity - user1.used;
    }

    // ============================================================
    // Level 4
    // ============================================================

    /**
     * Save a snapshot of all files currently owned by userId.
     *
     * Existing backup is overwritten.
     *
     * Snapshot stores values, not references.
     *
     * @returns {number|null}
     */
    backup_user(userId) {
        const user = this.users.get(userId);

        if (!user) {
            return null;
        }

        const snapshot = new Map();

        for (const name of user.files) {
            const file = this.files.get(name);

            snapshot.set(name, file.size);
        }

        this.backups.set(userId, snapshot);

        return snapshot.size;
    }

    /**
     * Restore user's files to their latest backup.
     *
     * Correct order:
     *
     * 1. Delete ALL files currently owned by the user.
     * 2. If user has no backup -> return 0.
     * 3. Restore every file in snapshot.
     * 4. If filename is now occupied by another user -> skip it.
     *
     * Backup remains after restore and can be reused.
     *
     * @returns {number|null}
     */
    restore_user(userId) {
        const user = this.users.get(userId);

        if (!user) {
            return null;
        }

        /*
         * Delete ALL current files first.
         *
         * Make a copy because _detach modifies user.files.
         */
        const currentFiles = [...user.files];

        for (const name of currentFiles) {
            this._detach(name);
        }

        /*
         * No previous backup:
         *
         * User's current files are still deleted.
         */
        const snapshot = this.backups.get(userId);

        if (!snapshot) {
            return 0;
        }

        let restored = 0;

        for (const [name, size] of snapshot) {
            /*
             * If some OTHER user created this filename since backup,
             * restoring it would create a global filename collision.
             *
             * Ignore that backup item.
             */
            if (this.files.has(name)) {
                continue;
            }

            this._attach(userId, name, size);
            restored++;
        }

        return restored;
    }

    // ============================================================
    // Optional aliases
    // ============================================================

    /*
     * 如果你拿到的题面命名不是标准 CodeSignal 名字，
     * 可以保留这些 aliases。
     */

    top_n_largest_files(prefix, n) {
        return this.get_n_largest(prefix, n);
    }

    add_file_to_user(userId, name, size) {
        return this.add_file_by(userId, name, size);
    }

    merge_users(userId1, userId2) {
        return this.merge_user(userId1, userId2);
    }
}