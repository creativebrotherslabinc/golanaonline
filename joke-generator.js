/*
 * Go LANA Joke Generator
 *
 * The original compiled app shipped with three categories containing three
 * jokes each. This enhancement keeps the existing UI but gives each category
 * a deterministic, very large joke library. The browser stores a cursor per
 * category, so a joke is not selected again until that category's library has
 * been exhausted.
 */
(function () {
  "use strict";

  var STORAGE_PREFIX = "golana-jokes-cursor-v1:";
  var activeCategory = "Programming";
  var categories = ["Programming", "Dad", "General"];

  var LIBRARIES = {
    Programming: {
      templates: [
        "Why did {who} {did} {thing}? Because {why}.",
        "{who} {did} {thing}. The official explanation was: {why}.",
        "A developer asked why {who} {did} {thing}. The answer? {why}.",
        "I watched {who} {did} {thing}. Naturally, {why}.",
      ],
      who: [
        "the programmer", "the junior developer", "the database", "the API",
        "the frontend engineer", "the backend engineer", "the compiler",
        "the rubber duck", "the code reviewer", "the server", "the script",
        "the debugger",
      ],
      did: [
        "refactor", "debug", "compile", "deploy", "query", "fork",
        "merge", "push", "parse", "cache", "commit", "restart",
      ],
      thing: [
        "the coffee machine", "a sandwich", "the calendar", "the keyboard",
        "a semicolon", "the production server", "a JSON file", "the router",
        "a rubber duck", "the build pipeline", "a password", "the cloud",
      ],
      why: [
        "it had a better interface", "the bug was actually a feature",
        "the tests were feeling left out", "it needed more bandwidth",
        "the cache said it was hungry", "the documentation told it to",
        "it was stuck in an infinite loop", "the syntax looked delicious",
        "the pull request had excellent taste", "it wanted to go serverless",
        "the exception asked nicely", "it had too many tabs open",
      ],
    },
    Dad: {
      templates: [
        "Why did {who} {did} {thing}? Because {why}.",
        "{who} {did} {thing}. I asked why, and {why}.",
        "My dad said {who} should {did} {thing}. His explanation: {why}.",
        "I saw {who} {did} {thing}. It was a dad joke waiting to happen: {why}.",
      ],
      who: [
        "the dad", "the sandwich", "the bicycle", "the tomato",
        "the calendar", "the scarecrow", "the math book", "the golfer",
        "the gardener", "the banana", "the pencil", "the tired parent",
      ],
      did: [
        "go to", "bring", "fix", "visit", "wear", "talk to",
        "carry", "leave", "call", "water", "borrow", "compliment",
      ],
      thing: [
        "the gym", "the doctor", "the library", "the beach",
        "a pair of pants", "the family barbecue", "a ladder", "the neighbor",
        "the kitchen", "a second banana", "the toolbox", "the front door",
      ],
      why: [
        "it was a little hoarse", "it needed a change of scenery",
        "it wanted to be outstanding in its field", "it had a lot on its plate",
        "it was trying to keep its belt up", "it was tired of being bread",
        "it had the right angle", "it was looking for a good thyme",
        "it wanted to make a good impression", "it was feeling a bit corny",
        "it had already seen the punchline", "it was taking things one step at a time",
      ],
    },
    General: {
      templates: [
        "Why did {who} {did} {thing}? Because {why}.",
        "{who} {did} {thing}. Nobody expected it, except {why}.",
        "The strange part was when {who} {did} {thing}. The reason: {why}.",
        "I asked why {who} {did} {thing}. The answer was simple: {why}.",
      ],
      who: [
        "the astronaut", "the librarian", "the chef", "the detective",
        "the musician", "the magician", "the penguin", "the tourist",
        "the scientist", "the neighbor", "the photographer", "the cat",
      ],
      did: [
        "take", "carry", "visit", "hide", "photograph", "question",
        "borrow", "wear", "follow", "invite", "measure", "adopt",
      ],
      thing: [
        "an umbrella", "the moon", "a tiny suitcase", "the elevator",
        "a mysterious hat", "the wrong train", "a pair of sunglasses",
        "the quietest cafe", "a very small map", "the last cookie",
        "a cardboard spaceship", "the empty theater",
      ],
      why: [
        "the forecast promised a plot twist", "it was late for an appointment",
        "the moon had excellent parking", "the elevator knew a good story",
        "the hat was clearly in charge", "the train had a one-track mind",
        "the sunglasses made everything look brighter", "the cafe was full of character",
        "the map needed some direction", "the cookie was going through a phase",
        "the spaceship had a generous cardboard budget", "the theater was looking for an audience",
      ],
    },
  };

  // Four 12-item dimensions and four templates produce 82,944 combinations
  // per category. The cursor is a mixed-radix number, so every combination
  // is visited once before the sequence starts over.
  function librarySize(library) {
    return library.templates.length *
      library.who.length *
      library.did.length *
      library.thing.length *
      library.why.length;
  }

  function readCursor(category, size) {
    var raw = window.localStorage.getItem(STORAGE_PREFIX + category);
    var cursor = Number.parseInt(raw || "0", 10);
    return Number.isFinite(cursor) && cursor >= 0 ? cursor % size : 0;
  }

  function writeCursor(category, cursor) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + category, String(cursor));
    } catch (_) {
      // Private browsing or a blocked storage policy should not disable jokes.
    }
  }

  function jokeAt(category, cursor) {
    var library = LIBRARIES[category];
    var remainder = cursor;
    var template = library.templates[remainder % library.templates.length];
    remainder = Math.floor(remainder / library.templates.length);
    var who = library.who[remainder % library.who.length];
    remainder = Math.floor(remainder / library.who.length);
    var did = library.did[remainder % library.did.length];
    remainder = Math.floor(remainder / library.did.length);
    var thing = library.thing[remainder % library.thing.length];
    remainder = Math.floor(remainder / library.thing.length);
    var why = library.why[remainder % library.why.length];

    return template
      .replace("{who}", who)
      .replace("{did}", did)
      .replace("{thing}", thing)
      .replace("{why}", why);
  }

  function nextJoke(category) {
    var size = librarySize(LIBRARIES[category]);
    var cursor = readCursor(category, size);
    var joke = jokeAt(category, cursor);
    writeCursor(category, (cursor + 1) % size);
    return { joke: joke, number: cursor + 1, total: size };
  }

  function findButton(label) {
    return Array.prototype.slice.call(document.querySelectorAll("button"))
      .find(function (button) {
        return button.textContent.trim() === label;
      });
  }

  function showJoke(result, button) {
    var card = document.querySelector("[data-golana-joke-result]");
    if (!card) {
      card = document.createElement("div");
      card.setAttribute("data-golana-joke-result", "true");
      card.className = "p-8 text-2xl font-serif italic bg-card border rounded-xl shadow-sm leading-relaxed";
      button.parentElement.appendChild(card);
    }
    card.textContent = '"' + result.joke + '"';
    card.setAttribute("aria-live", "polite");

  }

  function enhancePage() {
    if (window.location.pathname !== "/ai/jokes") return;
    var button = findButton("Tell me a joke");
    if (!button || button.getAttribute("data-golana-joke-button")) return;
    button.setAttribute("data-golana-joke-button", "true");

    var description = Array.prototype.slice.call(document.querySelectorAll("p"))
      .find(function (element) {
        return element.textContent.trim() === "Lighten the mood with a quick joke.";
      });
    if (description) {
      description.textContent = "Explore 82,944 different jokes per category with browser-based no-repeat history.";
    }
  }

  document.addEventListener("click", function (event) {
    if (window.location.pathname !== "/ai/jokes") return;
    var target = event.target.closest && event.target.closest("button");
    if (!target) return;
    var label = target.textContent.trim();
    if (categories.indexOf(label) !== -1) {
      activeCategory = label;
      return;
    }
    if (label !== "Tell me a joke") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showJoke(nextJoke(activeCategory), target);
    enhancePage();
  }, true);

  var observer = new MutationObserver(enhancePage);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("popstate", function () {
    activeCategory = "Programming";
    setTimeout(enhancePage, 50);
  });
  setTimeout(enhancePage, 250);
})();