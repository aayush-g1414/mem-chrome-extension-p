
document.addEventListener("DOMContentLoaded", () => {
  // Get HTML elements by their IDs
  const notesInput = document.getElementById("notes");
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");
  
  

  // Retrieve the API key from local storage and set it as the value of apiKeyInput
  chrome.storage.local.get("apiKey", (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });

  chrome.storage.local.get("suggestions", (data) => {
    
    if (data.suggestions) {
      notesInput.value = data.suggestions.notesInputString;
      chrome.storage.local.set({ suggestions: null }, () => {});
    }
  });

  // Event listener for the saveButton click event
  saveButton.addEventListener("click", () => {
    // Get the input values and remove any unnecessary whitespaces
    const apiKey = apiKeyInput.value.trim();
    const notes = notesInput.value.trim();
    const optionalTagsChecked = document.getElementById('optional-tags').checked;
    const optionParsingChecked = document.getElementById('option-parsing').checked;
    let addTags = optionalTagsChecked;
    let addOptions = optionParsingChecked;

    notesInput.value = "";
    // Check if the API key is provided
    if (apiKey === "") {
      displayMessage("Please enter your Mem API key.")
      return;
    }

    // Save the API key to local storage
    chrome.storage.local.set({ apiKey }, () => {});

    // Save the webpage to Mem
    saveWebpageToMem(apiKey, notes, addTags, addOptions);
  });

  
  
});

// Function to save the current webpage to Mem
async function saveWebpageToMem(apiKey, notes, addTags, addOptions) {
  try {
    // Get the current tab
    const tab = await getCurrentTab();
    const title = tab.title;
    const url = tab.url;
     
      // Validate the URL and extract the domain
      let domain = url;
      const length = url.length;
      for (var i = 0; i < length - 1; i++) {
          if (url.charAt(i) == "." && url.charAt(i+1) == "c" && url.charAt(i+2) == "o" && url.charAt(i+3) == "m") {
              domain = url.slice(i, i+4);
              break;
          } else if (url.charAt(i) == "." && url.charAt(i+1) == "o" && url.charAt(i+2) == "r" && url.charAt(i+3) == "g") {
              domain = url.slice(i, i+4);
              break;
          } else if (url.charAt(i) == "." && url.charAt(i+1) == "n" && url.charAt(i+2) == "e" && url.charAt(i+3) == "t") {
              domain = url.slice(i, i+4);
              break;
          } else if(url.charAt(i) == "." && url.charAt(i+1) == "a" && url.charAt(i+2) == "i"){
              domain = url.slice(i+3, length);
              break;
          } else if(url.charAt(i) == "." && url.charAt(i+1) == "i" && url.charAt(i+2) == "o"){
              domain = url.slice(i+3, length);
              break;
          }
      }

      if (domain != ".com" && domain != ".org" && domain != ".net") {
        displayMessage("Please enter a valid URL");
        return;
      }
      
      // Extract tags and notes from the input notes
      let notesToDisplay = "";
      let tags = "";
      for (var i = 0; i < length - 1; i++) {
          if (notes.charAt(i) == "#") {
              let j = i + 1;
              while (j < length && notes.charAt(j) != " ") {
                  j++;
              }
              tags += notes.slice(i, j) + " ";
              i = j;
          } else{
            notesToDisplay += notes.charAt(i);
          }
      }

      // Call Python functions for AI parsing and AI tags, make sure backend.py is running
      async function parseURL(url) {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "url": url })
          });
          if (response.ok) {
            const data = await response.json();
            return {"result": `${data.result}`};
          } else {
            displayMessage("Error with AI Parsing")
          }
        } catch (error) {
        }
      }

      async function tagsURL(url) {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "url": url })
          });
          if (response.ok) {
            const data = await response.json();
            return {"result": `${data.result}`};
          } else {
            displayMessage("Error with AI Tags")
          }
        } catch (error) {
        }
        
      }

      // Determine the content based on the user's preferences
      let parsed = "";
      let extraTags = "";
      if (addTags && addOptions) {
        parsed = await parseURL(url);
        extraTags = await tagsURL(url);
      } else if (addTags) {
        extraTags = await tagsURL(url);
      } else if (addOptions) {
        parsed = await parseURL(url);
      } else {
        parsed = {"result": ""};
        extraTags = {"result": ""};
      }

      let content = "";
      if (addTags && addOptions) {
         content = {"content": `${tags}\n\nAI Tags\n${extraTags.result}\n\n[${title}](${url})\n\n${notesToDisplay}\n# AI Notes\n${parsed.result}`};
      } else if (addTags) {
          content = {"content": `${tags}\n\nAI Tags\n${extraTags.result}\n\n[${title}](${url})\n\n${notesToDisplay}`};
      } else if (addOptions) {
          content = {"content": `${tags}\n\n[${title}](${url})\n\n${notesToDisplay}\n# AI Notes\n${parsed.result}`};
      } else {
          content = {"content": `${tags}\n\n[${title}](${url})\n\n${notesToDisplay}`};
      }

      // Create or update the Mem based on the user's preferences
      async function createMem(apiKey, content) {
        try {
          const response = await fetch("https://api.mem.ai/v0/mems", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `ApiAccessToken ${apiKey}`
            },
            body: JSON.stringify(content)
          });
      
          if (response.ok) {
            const data = await response.json();
            displayMessage("Saved to Mem, if you are continuing to work on this website, you can click the button again to append to the same mem. If not, it is advised you click \"Create new Mem\" to create a new mem");
            const baseUrl = new URL(url).origin;
            chrome.storage.local.set({ [baseUrl]: data.id }, () => {
            });
          } else {
            const error = await response.text();
            displayMessage(`Error creating Mem: ${error}`);
          }
        } catch (error) {
          displayMessage(`Error: ${error}`);
        }
      }

      
      async function updateMem(apiKey, memId, content) {
        try {
          const response = await fetch(`https://api.mem.ai/v0/mems/${memId}/append`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `ApiAccessToken ${apiKey}`
            },
            body: JSON.stringify({ content: content.content })
          });
      
          if (response.ok) {
            const data = await response.json();
            displayMessage("Added to previous mem");
          } else {
            const error = await response.text();
            displayMessage(`Error appending to Mem: ${error}`);
          }
        } catch (error) {
          displayMessage(`Error: ${error}`);
        }
      }
      
      // Gets the Base URL of the current tab
      const baseUrl = new URL(url).origin;
      const createNewMemChecked = document.getElementById("create-new-mem").checked;

      chrome.storage.local.get(baseUrl, async (data) => {
        if (data[baseUrl] && !createNewMemChecked) {
          await updateMem(apiKey, data[baseUrl], content);
        } else {
          await createMem(apiKey, content);
        }
      });


    } catch (error) {
      displayMessage(`Error: ${error.message}`);
    }
  }
  
  // Function to get the current active tab
  function getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length) {
          resolve(tabs[0]);
        } else {
          reject(new Error("No active tab found"));
        }
      });
    });
  }
  
  // Function to display a success/error to the user
  function displayMessage(message, messageType = "success") {
    const messageContainer = document.getElementById("message-container");
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
  