class ParcelTrackingSystem {
    constructor() {
        /**
         * parcelId -> Map<eventType, count>
         *
         * Example:
         * {
         *   "A" => {
         *      "B" => 11,
         *      "C" => 5
         *   }
         * }
         */
        this.parcels = new Map();
    }

    /**
     * Record an event for a parcel.
     *
     * @param {string} parcelId
     * @param {string} eventType
     * @param {number} count
     * @return {number}
     */
    recordEvent(parcelId, eventType, count) {
        // 如果 parcel 不存在，创建
        if (!this.parcels.has(parcelId)) {
            this.parcels.set(parcelId, new Map());
        }

        const events = this.parcels.get(parcelId);

        // 如果 eventType 不存在，之前的 count 就是 0
        const oldCount = events.get(eventType) ?? 0;

        const newCount = oldCount + count;

        events.set(eventType, newCount);

        return newCount;
    }

    /**
     * Get current count for one event type.
     *
     * @param {string} parcelId
     * @param {string} eventType
     * @return {number|null}
     */
    getEventCount(parcelId, eventType) {
        const events = this.parcels.get(parcelId);

        // parcel 不存在
        if (!events) {
            return null;
        }

        // eventType 不存在
        if (!events.has(eventType)) {
            return null;
        }

        return events.get(eventType);
    }

    /**
     * Remove one event type.
     *
     * @param {string} parcelId
     * @param {string} eventType
     * @return {boolean}
     */
    removeEvent(parcelId, eventType) {
        const events = this.parcels.get(parcelId);

        // parcel 不存在
        if (!events) {
            return false;
        }

        // eventType 不存在
        if (!events.has(eventType)) {
            return false;
        }

        events.delete(eventType);

        // 如果这个 parcel 已经没有任何 eventType，
        // 按题目要求把 parcel 整体删掉
        if (events.size === 0) {
            this.parcels.delete(parcelId);
        }

        return true;
    }
}

////------------------------------Claude-------------------------------------------/////

/**
 * CodeSignal Industry Coding Framework — Parcel Tracking System
 *
 * Level 1 的签名来自题面截图，完全准确。
 * Level 2 / 3 / 4 的签名是根据这套框架的惯例推断的（见文末注释），
 * 解锁后按实际签名改方法名即可 —— 内部状态和 _record 不需要动。
 */
class ParcelTrackingSystem {
    constructor() {
        /** parcelId -> Map<eventType, count>  —— 单一事实来源 */
        this.parcels = new Map();

        /** parcelId -> courierId （Level 3 起才会有条目） */
        this.owner = new Map();

        /** courierId -> { capacity, used, active } */
        this.couriers = new Map();

        /** courierId -> Map<parcelId, Map<eventType, count>>  （Level 4 快照） */
        this.backups = new Map();
    }

    // ==========================================================
    // Level 1
    // ==========================================================

    /**
     * int? RecordEvent(string parcelId, string eventType, int count)
     * 返回该 eventType 的新累计值；Level 1 永远非 null。
     */
    recordEvent(parcelId, eventType, count) {
        return this._record(parcelId, eventType, count, null);
    }

    /**
     * int? GetEventCount(string parcelId, string eventType)
     * parcel 或 eventType 不存在时返回 null（注意不是 undefined）。
     */
    getEventCount(parcelId, eventType) {
        const events = this.parcels.get(parcelId);
        if (!events || !events.has(eventType)) return null;
        return events.get(eventType);
    }

    /**
     * bool RemoveEvent(string parcelId, string eventType)
     * 删掉后若 parcel 再无任何 eventType，则整个 parcel 一起删除。
     */
    removeEvent(parcelId, eventType) {
        const events = this.parcels.get(parcelId);
        if (!events || !events.has(eventType)) return false;

        const freed = events.get(eventType);
        events.delete(eventType);

        // 归还容量（Level 3 起有意义，Level 1/2 是 no-op）
        const ownerId = this.owner.get(parcelId);
        if (ownerId !== undefined) {
            const courier = this.couriers.get(ownerId);
            if (courier) courier.used -= freed;
        }

        if (events.size === 0) {
            this.parcels.delete(parcelId);
            this.owner.delete(parcelId);
        }
        return true;
    }

    /**
     * 唯一的写入路径。courierId === null 表示系统级写入（Level 1/2），
     * 非 null 表示走 Level 3 的配额 + 归属校验。
     */
    _record(parcelId, eventType, count, courierId) {
        if (courierId !== null) {
            const courier = this.couriers.get(courierId);
            if (!courier || !courier.active) return null;

            const existingOwner = this.owner.get(parcelId);
            if (existingOwner !== undefined && existingOwner !== courierId) return null;

            if (courier.used + count > courier.capacity) return null;

            courier.used += count;
            this.owner.set(parcelId, courierId);
        }

        let events = this.parcels.get(parcelId);
        if (!events) {
            events = new Map();
            this.parcels.set(parcelId, events);
        }
        const next = (events.get(eventType) ?? 0) + count;
        events.set(eventType, next);
        return next;
    }

    // ==========================================================
    // Level 2 —— 按事件数排名
    // ==========================================================

    /**
     * 排序规则：总事件数降序，平手时 parcelId 字典序升序。
     * 返回形如 ["A(11)", "B(5)"]；不足 n 个就返回全部。
     * prefix 可选：有的变体是 GetTopNParcels(prefix, n)。
     */
    getTopParcels(n, prefix = '') {
        const rows = [];
        for (const [parcelId, events] of this.parcels) {
            if (prefix && !parcelId.startsWith(prefix)) continue;
            rows.push([parcelId, this._totalEvents(events)]);
        }
        rows.sort(
            (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
        );
        return rows.slice(0, n).map(([id, total]) => `${id}(${total})`);
    }

    _totalEvents(events) {
        // 若题面说的是"事件类型数"而非"累计次数"，把这里换成 events.size
        let sum = 0;
        for (const c of events.values()) sum += c;
        return sum;
    }

    // ==========================================================
    // Level 3 —— 快递员分配 + 按快递员记录
    // ==========================================================

    /** 新建快递员，已存在返回 false */
    addCourier(courierId, capacity) {
        if (this.couriers.has(courierId)) return false;
        this.couriers.set(courierId, { capacity, used: 0, active: true });
        return true;
    }

    /** 快递员不存在 / 已签出 / 包裹属于别人 / 超配额 → null */
    recordEventBy(courierId, parcelId, eventType, count) {
        return this._record(parcelId, eventType, count, courierId);
    }

    getCourierRemainingCapacity(courierId) {
        const courier = this.couriers.get(courierId);
        if (!courier) return null;
        return courier.capacity - courier.used;
    }

    /** 把 sourceId 名下的包裹和配额并入 targetId，返回 target 剩余配额 */
    mergeCouriers(targetId, sourceId) {
        if (targetId === sourceId) return null;
        const target = this.couriers.get(targetId);
        const source = this.couriers.get(sourceId);
        if (!target || !source) return null;

        for (const [parcelId, ownerId] of this.owner) {
            if (ownerId === sourceId) this.owner.set(parcelId, targetId);
        }
        target.capacity += source.capacity;
        target.used += source.used;

        this.couriers.delete(sourceId);
        this.backups.delete(sourceId);
        return target.capacity - target.used;
    }

    // ==========================================================
    // Level 4 —— 撤销变更 + 快递员签出
    // ==========================================================

    /** 快照该快递员名下所有包裹，返回包裹数 */
    backupCourier(courierId) {
        if (!this.couriers.has(courierId)) return null;

        const snapshot = new Map();
        for (const [parcelId, events] of this.parcels) {
            if (this.owner.get(parcelId) === courierId) {
                snapshot.set(parcelId, new Map(events)); // 浅拷贝够用：value 是数字
            }
        }
        this.backups.set(courierId, snapshot);
        return snapshot.size;
    }

    /**
     * 回滚到最近一次快照：
     *  - 快照后新建、且仍归该快递员的包裹被删除
     *  - 快照里有、但已被删掉的包裹被恢复
     *  - 若某个 parcelId 现已被别人占用，跳过（不抢）
     *  - 从未 backup 过 → 视为空快照
     */
    restoreCourier(courierId) {
        const courier = this.couriers.get(courierId);
        if (!courier) return false;

        for (const parcelId of [...this.parcels.keys()]) {
            if (this.owner.get(parcelId) === courierId) {
                this.parcels.delete(parcelId);
                this.owner.delete(parcelId);
            }
        }
        courier.used = 0;

        const snapshot = this.backups.get(courierId);
        if (!snapshot) return true;

        for (const [parcelId, events] of snapshot) {
            if (this.parcels.has(parcelId)) continue; // 已被其他快递员占用
            const copy = new Map(events);
            this.parcels.set(parcelId, copy);
            this.owner.set(parcelId, courierId);
            courier.used += this._totalEvents(copy);
        }
        return true;
    }

    /**
     * 签出：不再能记录事件，名下包裹解除归属（数据保留），配额释放。
     * 若题面要求签出时连包裹一起删除，把 owner.delete 换成 parcels.delete 即可。
     */
    signOutCourier(courierId) {
        const courier = this.couriers.get(courierId);
        if (!courier || !courier.active) return false;

        courier.active = false;
        for (const [parcelId, ownerId] of this.owner) {
            if (ownerId === courierId) this.owner.delete(parcelId);
        }
        courier.used = 0;
        return true;
    }
}

module.exports = ParcelTrackingSystem;
// ESM 环境用：export default ParcelTrackingSystem;