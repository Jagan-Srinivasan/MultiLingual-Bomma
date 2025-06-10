// This file contains functions for displaying and formatting content in the Bomma AI chat interface

// Function to format code blocks in messages
function formatCodeBlocks(element) {
  // Find all code blocks (text between triple backticks)
  const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g
  let html = element.innerHTML

  // Replace code blocks with properly formatted HTML
  html = html.replace(codeBlockRegex, (match, language, code) => {
    return `<pre><code class="language-${language || "plaintext"}">${escapeHtml(code)}</code></pre>`
  })

  // Replace inline code (text between single backticks)
  const inlineCodeRegex = /`([^`]+)`/g
  html = html.replace(inlineCodeRegex, "<code>$1</code>")

  element.innerHTML = html
}

// Function to escape HTML special characters
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Function to format links in messages
function formatLinks(element) {
  // Find all URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let html = element.innerHTML

  // Replace URLs with clickable links
  html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')

  element.innerHTML = html
}

// Function to format lists in messages
function formatLists(element) {
  // Find unordered lists (lines starting with - or *)
  const ulRegex = /^[\s]*[-*][\s]+(.*)/gm
  const html = element.innerHTML

  // Replace with proper HTML list
  let match
  let inList = false
  let formattedHtml = ""
  const lines = html.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.match(/^[\s]*[-*][\s]+/)) {
      if (!inList) {
        formattedHtml += "<ul>"
        inList = true
      }
      formattedHtml += "<li>" + line.replace(/^[\s]*[-*][\s]+/, "") + "</li>"
    } else {
      if (inList) {
        formattedHtml += "</ul>"
        inList = false
      }
      formattedHtml += line + "\n"
    }
  }

  if (inList) {
    formattedHtml += "</ul>"
  }

  element.innerHTML = formattedHtml
}

// Function to format tables in messages
function formatTables(element) {
  // Find table markers (lines with | character)
  const tableRegex = /\|(.+)\|/g
  const html = element.innerHTML

  // Check if there's a table
  if (html.match(tableRegex)) {
    const lines = html.split("\n")
    let inTable = false
    let tableHTML = '<table class="ai-table">'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Check if line is part of a table
      if (line.startsWith("|") && line.endsWith("|")) {
        if (!inTable) {
          inTable = true
        }

        // Check if it's a separator line
        if (line.replace(/\|/g, "").replace(/[-:]/g, "").trim() === "") {
          continue
        }

        // Process table row
        const cells = line.split("|").filter((cell) => cell.trim() !== "")
        const isHeader = i === 0 || (i === 2 && lines[1].includes("|-"))

        tableHTML += "<tr>"
        cells.forEach((cell) => {
          if (isHeader) {
            tableHTML += `<th>${cell.trim()}</th>`
          } else {
            tableHTML += `<td>${cell.trim()}</td>`
          }
        })
        tableHTML += "</tr>"
      } else if (inTable) {
        // End of table
        inTable = false
        tableHTML += "</table>"
        lines[i] = tableHTML + line
        tableHTML = '<table class="ai-table">'
      }
    }

    if (inTable) {
      tableHTML += "</table>"
      lines.push(tableHTML)
    }

    element.innerHTML = lines.join("\n")
  }
}

// Function to add syntax highlighting to code blocks
function addSyntaxHighlighting(element) {
  if (typeof hljs !== "undefined") {
    element.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block)
    })
  }
}

// Function to process message content
function processMessageContent(element) {
  formatCodeBlocks(element)
  formatLinks(element)
  formatLists(element)
  formatTables(element)
  addSyntaxHighlighting(element)
}

