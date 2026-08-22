/**
 * Task Management System — CodeSignal Industry Coding Framework 风格 4-Level 解法
 *
 * 核心数据模型：
 *   tasks:  Map<taskId, Task>          Task  = { id, seq, name, priority }
 *   users:  Map<userId, User>          User  = { id, quota, assignments: Assignment[] }
 *   Assignment = { taskId, userId, startTime, finishTime, completedAt|null }
 *
 * 关键不变量（invariant）：
 *   题目保证 timestamp 严格递增 ⇒ 每个 user.assignments 数组天然按 startTime 升序，
 *   无需任何排序即可满足「按 assignment time 升序」的 tie-break 要求，
 *   也让 complete_task 中「最早的 assignment」= 数组中第一个匹配项。
 */
class TaskManager {
    constructor() {
        /** @type {Map<string, {id:string, seq:number, name:string, priority:number}>} */
        this.tasks = new Map();
        /** @type {Map<string, {id:string, quota:number, assignments:Array<Object>}>} */
        this.users = new Map();
        this.nextSeq = 1;
    }

    // ==========================================================
    // Level 1 — 基础 CRUD
    // ==========================================================

    addTask(timestamp, name, priority) {
        const seq = this.nextSeq++;
        const id = `task_id_${seq}`;
        // seq 单独存一份：后面排序要按「数字序」而不是「字符串序」
        this.tasks.set(id, { id, seq, name, priority });
        return id;
    }

    updateTask(timestamp, taskId, name, priority) {
        const task = this.tasks.get(taskId);
        if (!task) return false;
        task.name = name;
        task.priority = priority;
        return true;
    }

    getTask(timestamp, taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return null;
        // JSON.stringify 默认无空白、按插入顺序输出 key，并正确转义 name 中的 " \ \n 等字符
        return JSON.stringify({ name: task.name, priority: task.priority });
    }

    // ==========================================================
    // Level 2 — 搜索与排序
    // ==========================================================

    /**
     * 统一的排序逻辑：priority 降序 → seq（创建顺序）升序
     * @param {(t:Object)=>boolean} [predicate]
     */
    _rankedTasks(predicate) {
        const result = [];
        for (const task of this.tasks.values()) {
            if (!predicate || predicate(task)) result.push(task);
        }
        result.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
        return result;
    }

    searchTasks(timestamp, nameFilter, maxResults) {
        if (maxResults <= 0) return [];
        return this._rankedTasks((t) => t.name.includes(nameFilter))
            .slice(0, maxResults)
            .map((t) => t.id);
    }

    listTasksSorted(timestamp, limit) {
        if (limit <= 0) return [];
        return this._rankedTasks()
            .slice(0, limit)
            .map((t) => t.id);
    }

    // ==========================================================
    // Level 3 — 用户、配额、带时间窗的分配
    // ==========================================================

    addUser(timestamp, userId, quota) {
        if (this.users.has(userId)) return false;
        this.users.set(userId, { id: userId, quota, assignments: [] });
        return true;
    }

    /**
     * 判断一条 assignment 在时刻 t 是否「活跃」（即是否占用配额）。
     *   1) 在时间窗内：startTime <= t < finishTime
     *   2) 尚未被完成：completedAt === null 或完成发生在 t 之后
     * 因为 timestamp 严格递增，条件 (2) 在实践中等价于 completedAt === null，
     * 但写成通用形式可以让逻辑对「历史时刻查询」也保持正确。
     */
    _isActive(a, t) {
        return (
            a.startTime <= t &&
            t < a.finishTime &&
            (a.completedAt === null || t < a.completedAt)
        );
    }

    assignTask(timestamp, taskId, userId, finishTime) {
        const user = this.users.get(userId);
        if (!user || !this.tasks.has(taskId)) return false;

        // 惰性过期（lazy expiration）：不用定时清理，
        // 每次分配时按「当前时刻」重新数一遍还活着的 assignment
        let activeCount = 0;
        for (const a of user.assignments) {
            if (this._isActive(a, timestamp)) activeCount++;
        }
        if (activeCount >= user.quota) return false;

        user.assignments.push({
            taskId,
            userId,
            startTime: timestamp,
            finishTime,
            completedAt: null,
        });
        return true;
    }

    getUserTasks(timestamp, userId) {
        const user = this.users.get(userId);
        if (!user) return [];
        return user.assignments
            .filter((a) => this._isActive(a, timestamp)) // filter 产生新数组，sort 不会破坏原始 startTime 顺序
            .sort((a, b) => a.finishTime - b.finishTime || a.startTime - b.startTime)
            .map((a) => a.taskId);
    }

    // ==========================================================
    // Level 4 — 完成任务与逾期统计
    // ==========================================================

    completeTask(timestamp, taskId, userId) {
        const user = this.users.get(userId);
        if (!user || !this.tasks.has(taskId)) return false;

        // assignments 已按 startTime 升序，第一条匹配的就是「最早的那次分配」
        for (const a of user.assignments) {
            if (a.taskId === taskId && this._isActive(a, timestamp)) {
                a.completedAt = timestamp; // 配额立即释放（因为 _isActive 之后会返回 false）
                return true;
            }
        }
        return false;
    }

    getOverdueAssignments(timestamp, userId) {
        const user = this.users.get(userId);
        if (!user) return [];
        return user.assignments
            .filter(
                (a) =>
                    a.finishTime <= timestamp &&
                    (a.completedAt === null || a.completedAt >= a.finishTime)
            )
            .sort((a, b) => a.finishTime - b.finishTime || a.startTime - b.startTime)
            .map((a) => a.taskId);
    }
}

// ==========================================================
// snake_case 别名：兼容题面给出的 Python 风格签名
// ==========================================================
Object.assign(TaskManager.prototype, {
    add_task: TaskManager.prototype.addTask,
    update_task: TaskManager.prototype.updateTask,
    get_task: TaskManager.prototype.getTask,
    search_tasks: TaskManager.prototype.searchTasks,
    list_tasks_sorted: TaskManager.prototype.listTasksSorted,
    add_user: TaskManager.prototype.addUser,
    assign_task: TaskManager.prototype.assignTask,
    get_user_tasks: TaskManager.prototype.getUserTasks,
    complete_task: TaskManager.prototype.completeTask,
    get_overdue_assignments: TaskManager.prototype.getOverdueAssignments,
});

// ==========================================================
// 自测
// ==========================================================
const assert = require("assert");

// ---- Level 1 ----
{
    const tm = new TaskManager();
    assert.strictEqual(tm.addTask(1, "Task 1", 5), "task_id_1");
    assert.strictEqual(tm.addTask(2, "Task 1", 5), "task_id_2"); // 同名同优先级允许
    assert.strictEqual(tm.updateTask(3, "task_id_1", "Updated Task 1", 4), true);
    assert.strictEqual(
        tm.getTask(4, "task_id_1"),
        '{"name":"Updated Task 1","priority":4}'
    );
    assert.strictEqual(tm.updateTask(5, "task_id_3", "Non-existing", 1), false);
    assert.strictEqual(tm.getTask(6, "task_id_9"), null);
    // 转义边界：name 中带引号
    tm.addTask(7, 'He said "hi"', 1);
    assert.strictEqual(
        tm.getTask(8, "task_id_3"),
        '{"name":"He said \\"hi\\"","priority":1}'
    );
}

// ---- Level 2 ----
{
    const tm = new TaskManager();
    tm.addTask(1, "Alpha", 10);
    tm.addTask(2, "Bravo", 15);
    tm.addTask(3, "Bravo Alpha", 5);
    assert.deepStrictEqual(tm.listTasksSorted(4, 2), ["task_id_2", "task_id_1"]);
    assert.deepStrictEqual(tm.searchTasks(6, "Bra", 5), [
        "task_id_2",
        "task_id_3",
    ]);
    assert.deepStrictEqual(tm.searchTasks(6, "bra", 5), []); // 大小写敏感
    tm.updateTask(6, "task_id_1", "Alpha Updated", 20);
    assert.deepStrictEqual(tm.searchTasks(7, "Al", 1), ["task_id_1"]);
    assert.deepStrictEqual(tm.searchTasks(8, "Al", 0), []);
}

// ---- 数字序 vs 字符串序 ----
{
    const tm = new TaskManager();
    for (let i = 1; i <= 12; i++) tm.addTask(i, `T${i}`, 5); // 全部同优先级
    const ids = tm.listTasksSorted(20, 12);
    assert.strictEqual(ids[1], "task_id_2");
    assert.strictEqual(ids[9], "task_id_10"); // 不是字符串排序的 task_id_10 < task_id_2
}

// ---- Level 3 ----
{
    const tm = new TaskManager();
    assert.strictEqual(tm.addUser(1, "user1", 2), true);
    assert.strictEqual(tm.addUser(2, "user1", 1), false);
    tm.addTask(3, "Task X", 10); // task_id_1
    tm.addTask(4, "Task Y", 5); // task_id_2
    tm.addTask(5, "Task Z", 1); // task_id_3
    assert.strictEqual(tm.assignTask(6, "task_id_1", "user1", 15), true);
    assert.deepStrictEqual(tm.getUserTasks(7, "user1"), ["task_id_1"]);
    assert.strictEqual(tm.assignTask(8, "task_id_2", "user1", 12), true);
    assert.strictEqual(tm.assignTask(9, "task_id_3", "user1", 20), false); // 配额满
    // finish_time 升序：task_id_2 (12) 在 task_id_1 (15) 之前
    assert.deepStrictEqual(tm.getUserTasks(10, "user1"), [
        "task_id_2",
        "task_id_1",
    ]);
    // t=13 时 task_id_2 已过期，配额自动释放
    assert.deepStrictEqual(tm.getUserTasks(13, "user1"), ["task_id_1"]);
    assert.strictEqual(tm.assignTask(14, "task_id_3", "user1", 30), true);
    assert.strictEqual(tm.assignTask(16, "task_id_1", "nobody", 30), false);
    assert.deepStrictEqual(tm.getUserTasks(17, "nobody"), []);
}

// ---- Level 4 ----
{
    const tm = new TaskManager();
    tm.addUser(1, "user1", 1);
    tm.addTask(2, "Task A", 10); // task_id_1
    tm.addTask(3, "Task B", 5); // task_id_2

    assert.strictEqual(tm.assignTask(4, "task_id_1", "user1", 100), true);
    assert.strictEqual(tm.assignTask(5, "task_id_2", "user1", 100), false); // 配额 1，已满
    assert.strictEqual(tm.completeTask(6, "task_id_1", "user1"), true);
    assert.deepStrictEqual(tm.getUserTasks(7, "user1"), []); // 完成后不再活跃
    assert.strictEqual(tm.assignTask(8, "task_id_2", "user1", 10), true); // 配额已即时释放
    assert.strictEqual(tm.completeTask(9, "task_id_1", "user1"), false); // 该分配已完成

    // t=11：task_id_2 的分配 (8,10) 未完成即过期 → overdue；task_id_1 已完成 → 不算
    assert.deepStrictEqual(tm.getOverdueAssignments(11, "user1"), ["task_id_2"]);
    assert.deepStrictEqual(tm.getOverdueAssignments(11, "ghost"), []);
}

// ---- 同一 task 多次分配给同一 user：complete 只结束最早的一条 ----
{
    const tm = new TaskManager();
    tm.addUser(1, "u", 5);
    tm.addTask(2, "A", 1); // task_id_1
    tm.assignTask(3, "task_id_1", "u", 50); // 分配 #1
    tm.assignTask(4, "task_id_1", "u", 40); // 分配 #2
    assert.strictEqual(tm.completeTask(5, "task_id_1", "u"), true); // 结束 #1（startTime 最小）
    // 剩下 #2 仍活跃
    assert.deepStrictEqual(tm.getUserTasks(6, "u"), ["task_id_1"]);
    // t=45：#2 (finish 40) 未完成 → overdue；#1 已完成 → 不算
    assert.deepStrictEqual(tm.getOverdueAssignments(45, "u"), ["task_id_1"]);
    // 同一 task 的多条逾期分配会重复出现
    tm.assignTask(46, "task_id_1", "u", 47);
    assert.deepStrictEqual(tm.getOverdueAssignments(60, "u"), [
        "task_id_1", // finish 40
        "task_id_1", // finish 47
    ]);
}

console.log("✅ All tests passed");

module.exports = TaskManager;