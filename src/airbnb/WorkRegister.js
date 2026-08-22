class WorkingHoursRegister {
    constructor({ unitsPerHour = 1 } = {}) {
        if (unitsPerHour <= 0) {
            throw new Error("unitsPerHour must be positive");
        }

        this.unitsPerHour = unitsPerHour;

        /**
         * id -> {
         *   id,
         *
         *   position,
         *   compensation,
         *
         *   currentSession: null | {
         *     start,
         *     position,
         *     rate
         *   },
         *
         *   sessions: [{
         *     start,
         *     end,
         *     position,
         *     rate
         *   }],
         *
         *   totalTime,
         *
         *   timeByPosition: Map<position, duration>
         * }
         */
        this.employees = new Map();

        /**
         * id -> {
         *   position,
         *   compensation,
         *   effectiveAt
         * }
         */
        this.pendingPromotions = new Map();

        /**
         * 全局 double-pay periods
         *
         * [{ start, end }]
         *
         * 不 merge。
         *
         * 因为题意是：
         * session 必须完整落在“某一个”grant period 中。
         */
        this.grantPeriods = [];
    }

    // =========================================================
    // Helpers
    // =========================================================

    #pay(duration, rate) {
        return (duration / this.unitsPerHour) * rate;
    }

    /**
     * pending promotion 只可能在 ENTER 时应用。
     *
     * 并且：
     *
     * enterTimestamp >= effectiveAt
     *
     * 才生效。
     */
    #applyPendingPromotion(emp, enterTimestamp) {
        const pending =
            this.pendingPromotions.get(emp.id);

        if (!pending) {
            return;
        }

        if (enterTimestamp < pending.effectiveAt) {
            return;
        }

        emp.position = pending.position;
        emp.compensation = pending.compensation;

        this.pendingPromotions.delete(emp.id);
    }

    /**
     * 必须被某一个 grant 完整包含。
     *
     * grant:
     *    100 ---------------- 300
     *
     * session:
     *          150 ---- 200
     *
     * => doubled
     */
    #isDoubledSession(session) {
        return this.grantPeriods.some(
            (grant) =>
                grant.start <= session.start &&
                session.end <= grant.end
        );
    }

    /**
     * session 和 query range 求交集。
     *
     * 使用 [start, end) 思维最自然。
     */
    #overlapDuration(
        sessionStart,
        sessionEnd,
        queryStart,
        queryEnd
    ) {
        const start = Math.max(
            sessionStart,
            queryStart
        );

        const end = Math.min(
            sessionEnd,
            queryEnd
        );

        return Math.max(0, end - start);
    }

    // =========================================================
    // Level 1
    // =========================================================

    addEmployee(id, position, compensation) {
        if (this.employees.has(id)) {
            return false;
        }

        this.employees.set(id, {
            id,

            position,
            compensation,

            currentSession: null,

            sessions: [],

            totalTime: 0,

            timeByPosition: new Map(),
        });

        return true;
    }

    /**
     * 同一个 register：
     *
     * outside -> IN
     * inside  -> OUT
     */
    register(id, timestamp) {
        const emp = this.employees.get(id);

        if (!emp) {
            return null;
        }

        // =====================================================
        // ENTER
        // =====================================================

        if (emp.currentSession === null) {
            /**
             * promotion 必须在创建 session 之前 apply。
             *
             * 因为 session 要 snapshot 新 position/rate。
             */
            this.#applyPendingPromotion(
                emp,
                timestamp
            );

            emp.currentSession = {
                start: timestamp,

                // snapshot historical state
                position: emp.position,
                rate: emp.compensation,
            };

            return "IN";
        }

        // =====================================================
        // EXIT
        // =====================================================

        const current = emp.currentSession;

        if (timestamp < current.start) {
            throw new Error(
                `Timestamp moved backwards: ` +
                `${current.start} -> ${timestamp}`
            );
        }

        const session = {
            start: current.start,
            end: timestamp,

            // 直接用 ENTER 时 snapshot 的值
            position: current.position,
            rate: current.rate,
        };

        emp.currentSession = null;

        const duration =
            session.end - session.start;

        emp.sessions.push(session);

        // only completed session counts
        emp.totalTime += duration;

        // Level 2
        const oldTime =
            emp.timeByPosition.get(
                session.position
            ) ?? 0;

        emp.timeByPosition.set(
            session.position,
            oldTime + duration
        );

        return "OUT";
    }

    getTotalTime(id) {
        const emp = this.employees.get(id);

        return emp
            ? emp.totalTime
            : null;
    }

    getPosition(id) {
        return (
            this.employees.get(id)?.position ??
            null
        );
    }

    isInOffice(id) {
        const emp = this.employees.get(id);

        if (!emp) {
            return null;
        }

        return emp.currentSession !== null;
    }

    // =========================================================
    // Level 2
    // =========================================================

    /**
     * position 传入时：
     *
     * 只看当前 position === position 的员工，
     * 但排名工时是该员工在这个 position 下完成的历史工时。
     *
     * position 不传时：
     *
     * 可以作为普通 totalTime Top N。
     */
    topNEmployees(n, position = null) {
        let employees =
            [...this.employees.values()];

        if (position !== null) {
            employees = employees.filter(
                (emp) =>
                    emp.position === position
            );
        }

        return employees
            .map((emp) => ({
                id: emp.id,

                time:
                    position === null
                        ? emp.totalTime
                        : (
                            emp.timeByPosition.get(
                                position
                            ) ?? 0
                        ),
            }))
            .sort(
                (a, b) =>
                    b.time - a.time ||
                    a.id.localeCompare(b.id)
            )
            .slice(0, n)
            .map(({ id, time }) => ({
                id,
                totalTime: time,
            }));
    }

    // =========================================================
    // Level 3
    // =========================================================

    /**
     * Promotion:
     *
     * 现在只 pending。
     *
     * 第一次
     *
     * ENTER timestamp >= effectiveAt
     *
     * 时真正生效。
     */
    promote(
        id,
        newPosition,
        newCompensation,
        effectiveAt = -Infinity
    ) {
        const emp =
            this.employees.get(id);

        if (!emp) {
            return false;
        }

        /**
         * 一般题目不允许同时存在两个
         * pending promotion。
         */
        if (
            this.pendingPromotions.has(id)
        ) {
            return false;
        }

        /**
         * 如果题目允许 same-position promotion，
         * 删除这个 check 即可。
         */
        if (
            emp.position === newPosition
        ) {
            return false;
        }

        this.pendingPromotions.set(id, {
            position: newPosition,
            compensation: newCompensation,
            effectiveAt,
        });

        return true;
    }

    getPendingPromotion(id) {
        const pending =
            this.pendingPromotions.get(id);

        return pending
            ? { ...pending }
            : null;
    }

    /**
     * Salary：
     *
     * query window 和历史 sessions
     * 分别求 overlap。
     *
     * historical rate 来自 session.rate。
     */
    calcSalary(
        id,
        from = -Infinity,
        to = Infinity
    ) {
        const emp =
            this.employees.get(id);

        if (!emp) {
            return null;
        }

        let total = 0;

        for (const session of emp.sessions) {
            const duration =
                this.#overlapDuration(
                    session.start,
                    session.end,
                    from,
                    to
                );

            if (duration === 0) {
                continue;
            }

            const multiplier =
                this.#isDoubledSession(session)
                    ? 2
                    : 1;

            total +=
                this.#pay(
                    duration,
                    session.rate
                ) * multiplier;
        }

        return total;
    }

    // =========================================================
    // Level 4
    // =========================================================

    addGrantPeriod(start, end) {
        if (end < start) {
            throw new Error(
                `Invalid grant period: ` +
                `[${start}, ${end}]`
            );
        }

        this.grantPeriods.push({
            start,
            end,
        });

        return true;
    }

    /**
     * “因为 double 而额外多发的钱”
     *
     * 普通：
     *   $100
     *
     * double：
     *   $200
     *
     * bonus：
     *   $100
     */
    getTotalDoubledSalary() {
        let total = 0;

        for (
            const emp
            of this.employees.values()
        ) {
            for (
                const session
                of emp.sessions
            ) {
                if (
                    !this.#isDoubledSession(
                        session
                    )
                ) {
                    continue;
                }

                const duration =
                    session.end -
                    session.start;

                total += this.#pay(
                    duration,
                    session.rate
                );
            }
        }

        return total;
    }

    /**
     * doubled sessions 实际支付的钱。
     *
     * normal 100
     * actual 200
     *
     * 返回 200。
     */
    getTotalDoubledPayout() {
        return (
            this.getTotalDoubledSalary() * 2
        );
    }
}