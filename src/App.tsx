import { useState } from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="App w-full">
      <div className="flex w-full absolute top-0 left-0 overflow-hidden right-0 bottom-0">
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
