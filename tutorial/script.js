/**
 * menu/script.js
 *
 * Plain vanilla script to populate and control a menu which
 * slides out when its hamburger icon is clicked.
 * 
 * Also controls a footer with #previous and #next buttons.
 */

const storage = new Storage()

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
let hash = ""
let tops = storage.getItem("tops") || {}
let activeItem
let noHash
let blocks // array of elements in main, sorted by top



const lastIndex = sections.length - 1
sections.forEach(( section, index ) => {
  const { id } = section
  if (id) {
    const header = section.firstElementChild
    const sectionName = section.dataset.item || getStartOfText(header)

    if (!(id in tops)) {
      // This section has just been added
      tops[id] = 0
    }

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


// Workaround needed for Safari prior to 17.4 (2024-03-05)
function checkVisibility(node) {
  const { width, height } = node.getBoundingClientRect()
  return !!width || !!height
}

function getVisibleBlocks() {
  let all = [];

  function isVisibleBlock(node) {
    const notBlock = blockTagNames.indexOf(node.tagName) < 0
    // const isVisible = node.checkVisibility()
    const isVisible = checkVisibility(node)
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
  hash = (location.hash || noHash).replace("#", "")
  
  // Update the list of block elements that are now visible
  blocks = getVisibleBlocks()
  
  // Update the section names in the footer
  setPreviousAndNext(hash)

  // Hilite the associated button in the menu
  setTargetClassInMenu(hash)

  // Scroll all the way to the top (to show the header)...
  main.scrollTo({ top: 0 })

  // Find the element that was straddling/at the top the last
  // time the user visited this page...
  const topMeasure = tops[hash]
  const topIndex = parseInt(topMeasure)
  const topElement = blocks[topIndex]
  // ... and scroll so that the same amount straddles the top
  // of the page now
  const fraction = topMeasure - topIndex // part that's invisible
  let { top, height } = topElement.getBoundingClientRect()

  if (fraction) {
    top += fraction * height
  }

  // ... and scroll the page to show it
  main.scrollTo({ top })
}

function setPreviousAndNext(hash) {
  const index = sectionIds.indexOf(hash)
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

function setTargetClassInMenu(hash) {
  const menuId = `menu-item-${hash}`

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
main.addEventListener("scroll", debounce(setScrollMeasure))

function setScrollMeasure() {
  // Check if the section is scrolled all the way to the end...
  const { scrollHeight, offsetHeight, scrollTop } = main
  const atEnd = scrollTop > scrollHeight - offsetHeight - endFudge
  
  let measure

  if (atEnd) {
    // ... and if so, ensure that the end of the section is
    // shown on the next visit, so that the #previous and #next
    // buttons are visible
    measure = blocks.length - 1

  } else {
    // Show the beginning of the block that was at the top
    let fraction
    measure = blocks.findIndex( block => {
      const { top, bottom } = block.getBoundingClientRect()
      const found = bottom > 0

      if (found) {
        fraction = -top / (bottom - top)
      }

      return found
    })

    // integer part = index of element
    // fractional part = proportion hidden above top of viewport
    measure = Math.max(0, measure) + fraction
  }

  tops[hash] = measure
  storage.set({ tops })
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

function goSection({ target }) {
  let { id } = target
  if (!id) {
    return
  }
  id = id.replace("-name", "")
  let direction = [0, "previous", 0, "next"].indexOf(id)
  // -1, 1, 3
  if (direction < 0) {
    return
  }

  const index = sectionIds.indexOf(hash)
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



document.body.addEventListener("click", showAnchor)

function showAnchor({ target }) {
  if (target.matches("button[data-name^=anchor]")) {
    const name = target.dataset.name
    const anchor = document.querySelector(`[name=${name}]`)
    if (!anchor) {
      // The <tag name="anchor-xxx"> element hasn't been added yet
      return
    }

    hash = anchor.closest("section[id]").id    
    location.hash = hash  
    anchor.classList.add("highlight")

    // The hashchange event won't be immediate, but it will scroll
    // the page to its previous position. Wait for that to happen
    // before scrolling to the anchor and removing the highlight.
    setTimeout(() => {
      anchor.scrollIntoView()
      anchor.classList.remove("highlight") 
    }, 10)
  }
}

// https://www.freecodecamp.org/news/javascript-debounce-example/
// USAGE //
// function postBounce(a,b,c){
//   console.log('Done', a, b, c);
// }
// const processChange = debounce(postBounce);
// for ( let ii = 0; ii < 1000; ii += 1 ) {
//   processChange(2,3,4)
// }
// // Will print Done 2 3 4 after bouncing is done

function debounce(debouncedFunction, delay = 300) {
  let timeout

  return (...args) => {
    clearTimeout(timeout);

    timeout = setTimeout(
      () => debouncedFunction.apply(null, args),
      delay
    );
  };
}



// Close the menu, now that the user has seen where it is
setTimeout(toggleMenu, closeDelay)