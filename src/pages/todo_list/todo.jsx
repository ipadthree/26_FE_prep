import "./todo.css";
import { useState } from "react";

export default function TodoList() {
  // 这里是一个简单的 Todo List 示例，使用 React 的 useState 来管理状态。
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const addTodo = () => {
    if (inputValue.trim() !== "") {
      setTodos([...todos, inputValue]);
      setInputValue("");
    }
  };

  const removeTodo = (index) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
  };

  return (
    <div className="todo-container">
      <h1>Todo List</h1>
      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a new todo..."
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <div className="todo-list">
        {todos.map((todo, index) => (
          <div key={index} className="todo-item">
            {todo}
            <button onClick={() => removeTodo(index)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
