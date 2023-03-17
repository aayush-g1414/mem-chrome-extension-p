const createInput = (id, labelText) => {
  // Create the label element and set its attributes and styles
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.innerText = labelText;
  label.style.display = "block";
  label.style.fontWeight = "bold";
  label.style.marginBottom = "5px";
  label.style.color = "white";

  // Create the textarea input element and set its attributes and styles
  const input = document.createElement("textarea");
  input.setAttribute("type", "text");
  input.setAttribute("id", id);
  input.style.width = "100%";
  input.style.padding = "5px";
  input.style.border = "1px solid #ccc";
  input.style.borderRadius = "3px";
  input.style.marginBottom = "10px";
  input.style.height = "100px";
  input.style.resize = "none";

  // Create a container and append the label and input elements to it
  const container = document.createElement("div");
  container.appendChild(label);
  container.appendChild(input);

  // Return the container with the label and input elements
  return container;
};

// Create the save notes button and set its styles
const saveNotes = document.createElement("button");
saveNotes.innerText = "Save Notes";
const css2 = `button {
  display: block;
  width: 100%;
  padding: 5px 10px;
  font-size: 16px;
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  cursor: pointer;
  margin-top: 10px;
  border-radius: 10px;
}`;
const style = document.createElement("style");
style.textContent = css2;
saveNotes.appendChild(style);

// Create the notes input container
const notesInputContainer = createInput("my-notes", "My Notes:");
notesInputContainer.style.padding = "5px 10px";

// Create a container for the messages
const container2 = document.createElement("div");
container2.id = "message-container2";

// Create the main container and set its styles
const container = document.createElement("div");
container.style.position = "fixed";
container.style.bottom = "20px";
container.style.right = "20px";
container.style.backgroundColor = "white";
container.style.border = "1px solid rgba(0, 0, 0, 0.2)";
container.style.borderRadius = "5px";
container.style.padding = "15px";
container.style.width = "300px";
container.style.zIndex = "9999";
container.style.backgroundImage = "linear-gradient(to right, #ec267f, #f83744)";
container.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)";

// Append the notes input container, save notes button, and messages container to the main container
container.appendChild(notesInputContainer);
container.appendChild(saveNotes);
container.appendChild(container2);

// Append the main container to the body of the document
document.body.appendChild(container);

// Add a click event listener to the save notes button to save the notes to local storage
saveNotes.addEventListener("click", async () => {
  const notesInput = document.getElementById("my-notes");
  const notesInputString = notesInput.value.toString();
  //clear the input box
  //notesInput.value = "";
  chrome.storage.local.set({ suggestions: { notesInputString } });
  displayMessage("Notes saved extension box!");
});

// Minimize button
const minimizeButton = document.createElement("button");
minimizeButton.innerText = "-";
minimizeButton.style.position = "absolute";
minimizeButton.style.top = "5px";
minimizeButton.style.right = "5px";
minimizeButton.style.padding = "0";
minimizeButton.style.width = "20px";
minimizeButton.style.height = "20px";
minimizeButton.style.border = "none";
minimizeButton.style.background = "transparent";
minimizeButton.style.color = "white";
minimizeButton.style.cursor = "pointer";
minimizeButton.style.fontSize = "18px";
minimizeButton.style.fontWeight = "bold";
minimizeButton.style.lineHeight = "18px";
minimizeButton.style.textAlign = "center";

let isMinimized = false;

// Add a click event listener to the minimize button to toggle the visibility of the relevant elements.
minimizeButton.addEventListener("click", () => {
  isMinimized = !isMinimized;
  minimizeButton.innerText = isMinimized ? "+" : "-";
  notesInputContainer.style.display = isMinimized ? "none" : "block";
  saveNotes.style.display = isMinimized ? "none" : "block";
  container2.style.display = isMinimized ? "none" : "block";
});

container.appendChild(minimizeButton);

// Display a message to the user
function displayMessage(message, messageType = "success") {
  const css = `
    .message {
      padding: 1rem;
      margin-top: 1rem;
      border-radius: 10px;
      text-align: center;
      font-weight: bold;
    }

    .message.success {
      background-color: white;
      color: #f83744;
      font-weight: bold;
    }

    .message.error {
      background-color: white;
      color: #f83744;
      font-weight: bold;
    }

    .close-button {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 5px;
      background-color: white;
      color: #f83744;
      cursor: pointer;
    }

    .close-button:hover {
      background-color: rgba(255, 255, 255, 0.4);
    }

    button {
      display: block;
      width: 100%;
      padding: 5x 10px;
      font-size: 16px;
      color: white;
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid white;
      cursor: pointer;
      margin-top: 10px;
      border-radius: 10px;
    }
    
    button:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const messageContainer = document.getElementById("message-container2");
  const messageElement = document.createElement("div");
  const messageElement2 = document.createElement("div");
  messageElement.className = `message ${messageType}`;

  const messageText = document.createElement("span");
  messageText.textContent = message;
  messageElement.appendChild(messageText);

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.textContent = "OK";
  closeButton.onclick = () => {
    messageContainer.removeChild(messageElement2);
    messageContainer.removeChild(messageElement);
  };
  
  messageElement2.appendChild(closeButton);

  messageContainer.appendChild(messageElement);
  messageContainer.appendChild(messageElement2);
}
