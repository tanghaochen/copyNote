import { useState } from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="App w-full">
      <div className="flex w-full">
        <div className="h-full">
          <NoteContent></NoteContent>
          <NoteOutlineTree></NoteOutlineTree>
        </div>
        <NoteContentOutline></NoteContentOutline>
      </div>
    </div>
  );
}

export default App;
