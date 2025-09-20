import React, { useRef, useState } from "react";
import * as yjs from "yjs";
import Editor from "@monaco-editor/react";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

const App = () => {
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const [latexCode, setLatexCode] = useState("\\frac{a}{b}");
  const [username, setUsername] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");

  const HandleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    const doc = new yjs.Doc();

    // ✅ Use WebSocket provider (central server)
    const provider = new WebsocketProvider(
      "https://latex-backend-q4sq.onrender.com", // 👈 your Hocuspocus server
      "latex-room", // room name
      doc
    );

    providerRef.current = provider;

    // Listen for connection status
    provider.on("status", (event) => {
      console.log("WebSocket status:", event.status);
      setConnectionStatus(event.status); // "connected" or "disconnected"
    });

    const type = doc.getText("latex-shared");

    new MonacoBinding(
      type,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    // ✅ Always set a username (fallback if empty)
    provider.awareness.setLocalStateField("user", {
      name: username || `User-${Math.floor(Math.random() * 1000)}`
    });

    // Listen for awareness changes
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((s) => s.user?.name).filter(Boolean);
      console.log("Awareness update:", users);
      setConnectedUsers(users);
    };

    provider.awareness.on("change", updateUsers);
    updateUsers();
  };

  const runLatex = () => {
    if (!editorRef.current) return;
    setLatexCode(editorRef.current.getValue());
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-6 bg-white rounded shadow-md text-center">
          <h2 className="text-lg font-bold mb-4">Enter Your Name</h2>
          <input
            type="text"
            placeholder="Your name"
            className="border p-2 rounded w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={() => username.trim() && setIsReady(true)}
            className="bg-blue-600 text-white px-4 py-2 mt-3 rounded hover:bg-blue-700 w-full"
          >
            Join Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-amber-200">
      {/* Left: Editor */}
      <div className="w-1/2 h-full flex flex-col">
        <Editor
          height="100%"
          width="100%"
          theme="vs-dark"
          defaultLanguage="latex"
          defaultValue="\\frac{a}{b}"
          onMount={HandleEditorMount}
        />
        <button
          onClick={runLatex}
          className="bg-green-600 text-white py-2 hover:bg-green-700"
        >
          ▶ Render LaTeX
        </button>

        {/* Show connected users */}
        <div className="bg-gray-900 text-white p-2 text-sm">
          <strong>Status:</strong> {connectionStatus} <br />
          <strong>Connected Users:</strong>{" "}
          {connectedUsers.length > 0
            ? connectedUsers.join(", ")
            : "No one else here"}
        </div>
      </div>

      {/* Right: Rendered Output */}
      <div className="w-1/2 h-full bg-white text-black p-4 overflow-auto">
        <h2 className="text-lg font-bold mb-2">Rendered Output</h2>
        <div className="p-4 border rounded-lg bg-gray-50">
          <BlockMath>{latexCode}</BlockMath>
        </div>
      </div>
    </div>
  );
};

export default App;
