"use strict";

/**
 * Banking System —— Level 1~4 完整实现
 *
 * 核心设计约定（面试时最好口头说出来）：
 *  1. 所有对外 API 的第一句都是 this._settle(timestamp)：把所有 executeAt <= timestamp
 *     的定时付款先"结算"掉，再执行当前操作。这样定时任务对 L1/L2 的影响就自动正确。
 *  2. 同一时刻的定序：定时付款 早于 当前这条指令。
 *     所以 cancelPayment(t) 去取消一个 executeAt === t 的付款，返回 false（已执行）。
 *  3. 每个账户维护 history: [[t, balanceAfter], ...]，时间非递减，用于 L4 的历史查询。
 *  4. 账户被 merge 掉之后进入 archived，保留其历史区间 [createdAt, mergedAt)。
 */
class BankingSystem {
    constructor() {
        /** @type {Map<string, Account>} 当前存在的账户 */
        this.accounts = new Map();
        /** @type {Map<string, Array<{createdAt:number, mergedAt:number, history:Array<[number,number]>}>>} */
        this.archived = new Map();
        /** @type {Map<string, Payment>} paymentId -> payment */
        this.payments = new Map();
        /** @type {Payment[]} 待执行队列，按 (executeAt, seq) 有序 */
        this.pending = [];
        this.paymentSeq = 0;
    }

    // ==================== 内部工具 ====================

    _newAccount(id, timestamp) {
        const acc = {
            id,
            balance: 0,
            outgoing: 0,          // 累计转出 / 付款总额（Level 2 用）
            createdAt: timestamp,
            history: [[timestamp, 0]],
            paymentIds: new Set(), // 该账户名下的 paymentId（merge 时需要改归属）
        };
        this.accounts.set(id, acc);
        return acc;
    }

    /** 记录一次余额变化。同一时间戳只保留最终值。 */
    _record(acc, t) {
        const h = acc.history;
        if (h.length && h[h.length - 1][0] === t) h[h.length - 1][1] = acc.balance;
        else h.push([t, acc.balance]);
    }

    /** 二分：找 history 中最后一个 time <= timeAt 的余额；找不到返回 null */
    static _lookup(history, timeAt) {
        let lo = 0, hi = history.length - 1, ans = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (history[mid][0] <= timeAt) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans === -1 ? null : history[ans][1];
    }

    /** 按 (executeAt, seq) 二分插入待执行队列 */
    _insertPending(p) {
        let lo = 0, hi = this.pending.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            const q = this.pending[mid];
            const before = q.executeAt < p.executeAt ||
                (q.executeAt === p.executeAt && q.seq < p.seq);
            if (before) lo = mid + 1; else hi = mid;
        }
        this.pending.splice(lo, 0, p);
    }

    /**
     * 结算函数：执行所有 executeAt <= timestamp 的定时付款。
     * 必须按时间顺序逐笔执行，因为前一笔会改变余额，从而影响后一笔能否成功。
     */
    _settle(timestamp) {
        let i = 0;
        while (i < this.pending.length && this.pending[i].executeAt <= timestamp) {
            const p = this.pending[i++];
            const acc = this.accounts.get(p.accountId);
            if (acc && acc.balance >= p.amount) {
                acc.balance -= p.amount;
                acc.outgoing += p.amount;
                this._record(acc, p.executeAt);   // 注意：记在 executeAt，不是 timestamp
                p.status = "COMPLETED";
            } else {
                // 余额不足：本次失败且不重试（这是这题最常见的判定）
                p.status = "FAILED";
            }
        }
        if (i > 0) this.pending = this.pending.slice(i);
    }

    // ==================== Level 1 ====================

    /** @returns {boolean} 账户已存在返回 false */
    createAccount(timestamp, accountId) {
        this._settle(timestamp);
        if (this.accounts.has(accountId)) return false;
        this._newAccount(accountId, timestamp);
        return true;
    }

    /** @returns {number|null} 存款后余额；账户不存在返回 null */
    deposit(timestamp, accountId, amount) {
        this._settle(timestamp);
        const acc = this.accounts.get(accountId);
        if (!acc) return null;
        acc.balance += amount;
        this._record(acc, timestamp);
        return acc.balance;
    }

    /** @returns {number|null} 转出方余额；任一账户不存在 / 自转 / 余额不足 返回 null */
    transfer(timestamp, sourceId, targetId, amount) {
        this._settle(timestamp);
        if (sourceId === targetId) return null;
        const src = this.accounts.get(sourceId);
        const dst = this.accounts.get(targetId);
        if (!src || !dst) return null;
        if (src.balance < amount) return null;

        src.balance -= amount;
        dst.balance += amount;
        src.outgoing += amount;
        this._record(src, timestamp);
        this._record(dst, timestamp);
        return src.balance;
    }

    // ==================== Level 2 ====================

    /**
     * @returns {string[]} 形如 ["acc1(500)", "acc2(200)"]
     * 排序：outgoing 降序 -> accountId 字典序升序
     */
    topSpenders(timestamp, n) {
        this._settle(timestamp);
        const list = [...this.accounts.values()];
        list.sort((a, b) => (b.outgoing - a.outgoing) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        return list.slice(0, n).map(a => `${a.id}(${a.outgoing})`);
    }

    // ==================== Level 3 ====================

    /** @returns {string|null} "payment1" / "payment2" ...；账户不存在返回 null */
    schedulePayment(timestamp, accountId, amount, delay) {
        this._settle(timestamp);
        if (!this.accounts.has(accountId)) return null;
        const id = `payment${++this.paymentSeq}`;
        const p = {
            id,
            accountId,
            amount,
            seq: this.paymentSeq,
            executeAt: timestamp + delay,
            status: "IN_PROGRESS",
        };
        this.payments.set(id, p);
        this.accounts.get(accountId).paymentIds.add(id);
        this._insertPending(p);
        return id;
    }

    /**
     * @returns {boolean}
     * false 的情况：账户不存在 / paymentId 不存在 / 不属于该账户 / 已执行或已取消
     */
    cancelPayment(timestamp, accountId, paymentId) {
        this._settle(timestamp);
        if (!this.accounts.has(accountId)) return false;
        const p = this.payments.get(paymentId);
        if (!p || p.accountId !== accountId) return false;
        if (p.status !== "IN_PROGRESS") return false;
        const idx = this.pending.indexOf(p);
        if (idx !== -1) this.pending.splice(idx, 1);
        p.status = "CANCELED";
        return true;
    }

    /** @returns {string|null} IN_PROGRESS / COMPLETED / FAILED / CANCELED */
    getPaymentStatus(timestamp, accountId, paymentId) {
        this._settle(timestamp);
        if (!this.accounts.has(accountId)) return null;
        const p = this.payments.get(paymentId);
        if (!p || p.accountId !== accountId) return null;
        return p.status;
    }

    // ==================== Level 4 ====================

    /**
     * 把 accountId2 并入 accountId1，accountId2 从此不存在。
     * @returns {boolean}
     */
    mergeAccounts(timestamp, accountId1, accountId2) {
        this._settle(timestamp);
        if (accountId1 === accountId2) return false;
        const a1 = this.accounts.get(accountId1);
        const a2 = this.accounts.get(accountId2);
        if (!a1 || !a2) return false;

        // 1) 余额 & 消费额合并
        a1.balance += a2.balance;
        a1.outgoing += a2.outgoing;
        this._record(a1, timestamp);

        // 2) 未执行的定时付款改由 a1 扣款，paymentId 保持不变
        for (const p of this.pending) {
            if (p.accountId === accountId2) p.accountId = accountId1;
        }
        for (const pid of a2.paymentIds) {
            const p = this.payments.get(pid);
            if (p) p.accountId = accountId1;
            a1.paymentIds.add(pid);
        }

        // 3) a2 归档：保留 [createdAt, timestamp) 这段历史，供 getBalance 查询
        this.accounts.delete(accountId2);
        if (!this.archived.has(accountId2)) this.archived.set(accountId2, []);
        this.archived.get(accountId2).push({
            createdAt: a2.createdAt,
            mergedAt: timestamp,
            history: a2.history,
        });
        return true;
    }

    /**
     * 查询 accountId 在 timeAt 时刻的余额。
     * @returns {number|null} 该时刻账户不存在（尚未创建 / 已被合并掉）返回 null
     */
    getBalance(timestamp, accountId, timeAt) {
        // 关键：先结算到 timestamp。timeAt 之前该发生的定时扣款必须已经落到 history 上。
        this._settle(timestamp);

        const acc = this.accounts.get(accountId);
        if (acc && acc.createdAt <= timeAt) {
            return BankingSystem._lookup(acc.history, timeAt);
        }
        // 可能这个 id 曾经存在过（被合并掉了，甚至之后又被重新创建）
        const segs = this.archived.get(accountId);
        if (segs) {
            for (const s of segs) {
                if (s.createdAt <= timeAt && timeAt < s.mergedAt) {
                    return BankingSystem._lookup(s.history, timeAt);
                }
            }
        }
        return null;
    }
}

// ============================================================
// 测试
// ============================================================
let pass = 0, fail = 0;
function eq(actual, expected, msg) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a === e) { pass++; }
    else { fail++; console.log(`FAIL: ${msg}\n  expected ${e}\n  actual   ${a}`); }
}

const b = new BankingSystem();

// ---- Level 1 ----
eq(b.createAccount(1, "a1"), true, "create a1");
eq(b.createAccount(2, "a1"), false, "duplicate create");
eq(b.createAccount(3, "a2"), true, "create a2");
eq(b.deposit(4, "a1", 2000), 2000, "deposit");
eq(b.deposit(5, "ghost", 100), null, "deposit to missing account");
eq(b.transfer(6, "a1", "a2", 500), 1500, "transfer ok");
eq(b.transfer(7, "a1", "a1", 1), null, "self transfer");
eq(b.transfer(8, "a1", "ghost", 1), null, "transfer to missing");
eq(b.transfer(9, "a1", "a2", 999999), null, "insufficient funds");

// ---- Level 2 ----
eq(b.topSpenders(10, 3), ["a1(500)", "a2(0)"], "topSpenders basic");

// ---- Level 3 ----
eq(b.schedulePayment(11, "a1", 300, 100), "payment1", "schedule p1 (exec@111)");
eq(b.schedulePayment(12, "a2", 100, 50), "payment2", "schedule p2");
eq(b.schedulePayment(12, "ghost", 100, 50), null, "schedule on missing account");
eq(b.cancelPayment(13, "a2", "payment2"), true, "cancel p2");
eq(b.cancelPayment(14, "a2", "payment2"), false, "double cancel");
eq(b.cancelPayment(14, "a1", "payment1") && b.schedulePayment(15, "a1", 300, 96), "payment3",
    "cancel then reschedule -> exec@111");
eq(b.getBalance(111, "a1", 110), 1500, "before scheduled payment");
eq(b.getBalance(111, "a1", 111), 1200, "scheduled payment settled at exact ts");

// ---- Level 4: merge ----
eq(b.createAccount(120, "a3"), true, "create a3");
eq(b.deposit(121, "a3", 1000), 1000, "deposit a3");
eq(b.schedulePayment(122, "a3", 200, 100), "payment4", "schedule p4 on a3 (exec@222)");
eq(b.mergeAccounts(130, "a1", "a3"), true, "merge a3 -> a1");
eq(b.mergeAccounts(131, "a1", "a3"), false, "merge again fails");
eq(b.mergeAccounts(131, "a1", "a1"), false, "merge self fails");
eq(b.getBalance(131, "a1", 130), 2200, "a1 balance after merge");
eq(b.getBalance(131, "a3", 130), null, "a3 gone at merge time");
eq(b.getBalance(131, "a3", 129), 1000, "a3 historical balance before merge");
eq(b.getBalance(131, "a3", 119), null, "a3 not yet created");
eq(b.getBalance(131, "a1", 129), 1200, "a1 own history before merge");
eq(b.cancelPayment(140, "a3", "payment4"), false, "cancel via dead account id");
eq(b.getPaymentStatus(140, "a1", "payment4"), "IN_PROGRESS", "inherited payment ownership");
eq(b.getBalance(222, "a1", 222), 2000, "inherited scheduled payment debits a1");
// a1 outgoing = 500 (transfer) + 300 (payment3) + 200 (inherited payment4) = 1000
eq(b.topSpenders(223, 5), ["a1(1000)", "a2(0)"], "topSpenders after merge");

// ---- Level 4: 边界 ----
const c = new BankingSystem();
c.createAccount(300, "b1");
c.deposit(301, "b1", 100);
eq(c.schedulePayment(302, "b1", 500, 10), "payment1", "schedule underfunded");
eq(c.getPaymentStatus(320, "b1", "payment1"), "FAILED", "underfunded payment fails, no retry");
eq(c.getBalance(320, "b1", 320), 100, "balance untouched after failed payment");

const d = new BankingSystem();
d.createAccount(400, "c1");
d.deposit(401, "c1", 100);
eq(d.schedulePayment(402, "c1", 50, 10), "payment1", "schedule exec@412");
eq(d.cancelPayment(412, "c1", "payment1"), false, "cancel at exact exec time -> already executed");
eq(d.getBalance(412, "c1", 412), 50, "executed");
eq(d.getBalance(500, "c1", 399), null, "before creation -> null");
eq(d.getBalance(500, "ghost", 400), null, "never existed -> null");

// 链式 merge + 归档区间不重叠
const e = new BankingSystem();
e.createAccount(1, "x"); e.deposit(2, "x", 100);
e.createAccount(3, "y"); e.deposit(4, "y", 200);
e.createAccount(5, "z"); e.deposit(6, "z", 300);
eq(e.mergeAccounts(10, "y", "z"), true, "z -> y");
eq(e.mergeAccounts(20, "x", "y"), true, "y -> x");
eq(e.getBalance(30, "x", 30), 600, "chained merge total");
eq(e.getBalance(30, "y", 15), 500, "y历史(含z)");
eq(e.getBalance(30, "y", 20), null, "y已被合并");
eq(e.getBalance(30, "z", 9), 300, "z历史");
eq(e.getBalance(30, "z", 10), null, "z已被合并");
eq(e.createAccount(40, "z"), true, "同名账户可以重建");
eq(e.getBalance(50, "z", 45), 0, "重建后的新账户");
eq(e.getBalance(50, "z", 9), 300, "旧归档区间仍可查");

console.log(`\n${pass} passed, ${fail} failed`);