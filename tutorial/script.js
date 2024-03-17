/**
 * menu/script.js
 *
 * Plain vanilla script to populate and control a menu which
 * slides out when its hamburger icon is clicked.
 * 
 * Also controls a footer with #previous and #next buttons.
 */



const main     = document.getElementById("main")
const menu     = document.getElementById("menu")
const icon     = document.getElementById("menu-icon")
const list     = document.getElementById("menu-items")
const sections = Array.from(document.querySelectorAll("section"))
const foot     = document.getElementById("footer")
const prev     = document.getElementById("previous")
const prevName = document.getElementById("previous-name")
const next     = document.getElementById("next")
const nextName = document.getElementById("next-name")

const linkLength = 32

// CUSTOMIZE THIS FUNCTION WHICH IS CALLED BY getVisibleBlocks //
const ignoreElement = element => {
  const tagsToIgnore = [ "SECTION" ]
  return tagsToIgnore.indexOf(element.tagName) > -1
}

const blockTagNames = [
  "H1", "H2", "H3", "H4", "H5", "H6",
  "P",
  "PRE",
  "OL", "UL", "DL", "DD", "DT",
  "DIV",
  "ASIDE",
  "BLOCKQUOTE",
  "FIGURE",
  "FIGCAPTION",

  "ADDRESS",
  "CANVAS",
  "FORM",
  "FIELDSET",
  "FOOTER",
  "HEADER",
  "HR",
  "LI",
  "TABLE",
  "VIDEO",

  "ARTICLE",
  "MAIN",
  "NAV",
  "SECTION"
]


let menuIsOpen = true   // could read from localStorage
const closeDelay = 2000 // ms
const endFudge = 10     // pixels from bottom when scrolled to end
const sectionIds = []
const sectionNames = []
const menuItems = []
let target = ""
let tops = {}
let activeItem
let noHash
let blocks



const lastIndex = sections.length - 1
const items = sections.forEach(( section, index ) => {
  const { id } = section
  if (id) {
    const header = section.firstElementChild
    const sectionName = section.dataset.item || getStartOfText(header)
    tops[id] = main

    const li = document.createElement("li")
    li.setAttribute("id", `menu-item-${id}`)
    const a = document.createElement("a")
    a.setAttribute("href", `#${id}`)
    a.setAttribute("draggable", false)

    a.textContent = sectionName
    li.append(a)

    if (index === lastIndex) {
      // The last child should appear with no hash/target,
      // and should appear first in the menu
      // a.setAttribute("href", `/`)
      list.prepend(li)

      noHash = id
      sectionIds.unshift(id)
      sectionNames.unshift(sectionName)

    } else {
      list.append(li)
      sectionIds.push(id)
      sectionNames.push(sectionName)
    }

    menuItems.push(li)
  }
})


hashChange()



function getVisibleBlocks() {
  let all = [];

  function isVisibleBlock(node) {
    const notBlock = blockTagNames.indexOf(node.tagName) < 0
    const isVisible = node.checkVisibility()
    return !notBlock && isVisible
  }

  function getDescendants(node) {
    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];

      if (isVisibleBlock(child)) {
        getDescendants(child);
        if (!ignoreElement(child)) {
          all.push(child);
        }
      }
    }
  }

  function byTop(a, b) {
    const { top: aTop } = a.getBoundingClientRect()
    const { top: bTop } = b.getBoundingClientRect()
    return aTop - bTop
  }

  getDescendants(main);

  all = all.sort(byTop)

  return all
}



// Scroll to the last position shown for the chosen page
window.addEventListener("hashchange", hashChange)

function hashChange() {
  // The hash change will show the associated section, and place
  // the section at the top of the viewport.
  target = (location.hash || noHash).replace("#", "")
  setPreviousAndNext(target)

  // Update the list of block elements that are visible
  blocks = getVisibleBlocks()

  // Hilite the associated button in the menu
  setTargetClassInMenu(target)

  // Scroll all the way to the top (to show the header)...
  main.scrollTo({ top: 0 })

  // Find the top of the element that the user had scrolled to
  // when last visiting the page...
  const topElement = tops[target]
  const { top } = topElement.getBoundingClientRect()

  // ... and scroll the page to show it
  main.scrollTo({ top })
}

function setPreviousAndNext(target) {
  const index = sectionIds.indexOf(target)
  const isLast = (index === sectionIds.length - 1)

  if (index) {
    prev.removeAttribute("disabled")
    prevName.textContent = sectionNames[index - 1]
  } else {
    prev.setAttribute("disabled", true)
    prevName.textContent = ""
  }

  if (isLast) {
    next.setAttribute("disabled", true)
    nextName.textContent = ""
  } else {
    next.removeAttribute("disabled")
    nextName.textContent = sectionNames[index + 1]
  }
}

function setTargetClassInMenu(target) {
  const menuId = `menu-item-${target}`

  menuItems.forEach( menuItem => {
    if (menuItem.id === menuId) {
      activeItem = menuItem
      activeItem.classList.add("target")
      // Ensure the entire button is visible
      activeItem.scrollIntoView()

    } else {
      menuItem.classList.remove("target")
    }
  })
}


// Remember where this page was last scrolled to
main.addEventListener("scroll", setScrollElement)

function setScrollElement() {
  // Check if the section is scrolled all the way to the end...
  const { scrollHeight, offsetHeight, scrollTop } = main
  const atEnd = scrollTop > scrollHeight - offsetHeight - endFudge
  
  let topIndex

  if (atEnd) {
    // ... and if so, ensure that the end of the section is
    // shown on the next visit, so that the #previous and #next
    // buttons are visible
    topIndex = blocks.length - 1

  } else {
    // Show the beginning of the block that was at the top
    topIndex = blocks.findIndex( block => {
      const { bottom } = block.getBoundingClientRect()
      return bottom > 0
    })
    topIndex = Math.max(0, topIndex)
  }

  const topElement = blocks[topIndex]

  tops[target] = topElement
}


icon.addEventListener("click", toggleMenu)

function toggleMenu() {
  menuIsOpen = !menuIsOpen
  const action = menuIsOpen ? "add" : "remove"
  menu.classList[action]("open")

  if (menuIsOpen) {
    // Prepare to close the menu if click is not on a page link
    document.body.onmousedown = closeMenu
    // Centre the item for the current page
    activeItem.scrollIntoView({ block: "center" })

  } else {
    document.body.onmousedown = null
  }

  function closeMenu({ target }) {
    while (target) {
      if (target === list || target === icon) {
        break
      }
      target = target.parentNode
    }

    if (target) {
      // Let the click on the icon do its own work
      return
    }

    toggleMenu()
  }
}


foot.addEventListener("mouseup", goSection)

function goSection({ target: button }) {
  const { id } = button
  let direction = [0, "previous", 0, "next"].indexOf(id)
  // -1, 1, 3
  if (direction < 0) {
    return
  }

  const index = sectionIds.indexOf(target)
              + direction - 2
  const sectionId = sectionIds[index]
  location.hash = sectionId
}


function getStartOfText(element) {
  const punctuation = [".", ",", ":", ";", "-", "—", " "]
  const stop = [".", "!", "?", "\""]


  let text = element.textContent
  const length = text.length
  if (length > linkLength) {
    text = text.slice(0, linkLength)
    text = text.replace(/(\n)|(\\n)/g, "").trim()
    const spaceIndex = text.lastIndexOf(" ")
    if (spaceIndex > 0) {
      text = text.slice(0, spaceIndex)
      while (punctuation.indexOf(text.slice(-1)) > 0) {
        text = text.slice(0, -1)
      }

      if (stop.indexOf(text.slice(-1)) < 0) {
        text += "…"
      }
    }
  }

  return text
}



// Close the menu, now that the user has seen where it is
setTimeout(toggleMenu, closeDelay)