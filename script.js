/* ===================================================================
   NEXORA DIGITAL TWIN — CANONICAL CORE CONTROLLER (script.js)
   Production Runtime & Loading Architecture
   =================================================================== */

// -------------------------------------------------------------------
// 01 ENVIRONMENT & ACCESSIBILITY CONFIGURATION
// -------------------------------------------------------------------
var prefersReducedMotion = false;
try {
  prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
} catch (e) {
  prefersReducedMotion = false;
}

var isTouchDevice = false;
try {
  isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 1024);
} catch (e) {
  isTouchDevice = false;
}

var locoScroll = null;

// -------------------------------------------------------------------
// 02 LOCOMOTIVE SCROLL & GSAP SCROLLTRIGGER ENGINE
// -------------------------------------------------------------------
function initScrollEngine() {
  var mainEl = document.querySelector("#main");
  if (!mainEl) return;

  var hasGsap = typeof gsap !== "undefined";
  var hasScrollTrigger = typeof ScrollTrigger !== "undefined";
  var hasLocomotive = typeof LocomotiveScroll !== "undefined";

  if (hasGsap && hasScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (err) {
      console.warn("GSAP plugin registration notice:", err);
    }

    // Use Locomotive on desktop when smooth scroll is suitable and reduced motion is off
    if (hasLocomotive && !isTouchDevice && !prefersReducedMotion) {
      try {
        locoScroll = new LocomotiveScroll({
          el: mainEl,
          smooth: true,
          tablet: { smooth: false },
          smartphone: { smooth: false }
        });
        window.locoScrollInstance = locoScroll;

        locoScroll.on("scroll", ScrollTrigger.update);

        ScrollTrigger.scrollerProxy("#main", {
          scrollTop: function (value) {
            if (arguments.length) {
              locoScroll.scrollTo(value, 0, 0);
            } else if (locoScroll.scroll && locoScroll.scroll.instance) {
              return locoScroll.scroll.instance.scroll.y;
            } else {
              return window.pageYOffset || document.documentElement.scrollTop || 0;
            }
          },
          getBoundingClientRect: function () {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          },
          pinType: mainEl.style.transform ? "transform" : "fixed"
        });

        ScrollTrigger.addEventListener("refresh", function () {
          if (locoScroll && typeof locoScroll.update === "function") {
            locoScroll.update();
          }
        });
      } catch (e) {
        console.warn("LocomotiveScroll initialization fallback:", e);
        setupFallbackScroller(mainEl);
      }
    } else {
      setupFallbackScroller(mainEl);
    }

    try {
      ScrollTrigger.refresh();
    } catch (e) {}
  } else {
    console.warn("GSAP / ScrollTrigger CDN unavailable — site operating in resilient native mode.");
  }
}

function setupFallbackScroller(mainEl) {
  if (typeof ScrollTrigger === "undefined") return;
  try {
    ScrollTrigger.scrollerProxy("#main", {
      scrollTop: function (value) {
        return arguments.length
          ? window.scrollTo(0, value)
          : (window.pageYOffset || document.documentElement.scrollTop || 0);
      },
      getBoundingClientRect: function () {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: "fixed"
    });
  } catch (e) {
    // Non-blocking fallback
  }
}

initScrollEngine();

// Refresh scroll bounds when window finishes loading
window.addEventListener("load", function () {
  if (locoScroll && typeof locoScroll.update === "function") {
    locoScroll.update();
  }
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
  // Autoplay hero & ambient videos safely without unhandled rejections
  document.querySelectorAll("video").forEach(function (v) {
    v.muted = true;
    var playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {});
    }
  });
});

// Refresh after font face rendering to ensure pin offsets match final typography
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(function () {
    if (locoScroll && typeof locoScroll.update === "function") {
      locoScroll.update();
    }
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });
}

// -------------------------------------------------------------------
// 03 TEXT REVELATION ANIMATIONS (#page2, #page4, #page6)
// -------------------------------------------------------------------
function initSplitText(selector) {
  var heading = document.querySelector(selector);
  if (!heading) return;

  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  // If GSAP is not available or reduced-motion is requested, ensure text is fully visible immediately
  if (!hasGsap || prefersReducedMotion) {
    heading.style.color = "#F4E7C1";
    return;
  }

  try {
    var text = heading.textContent.trim();
    var spans = "";
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      if (char === " ") {
        spans += "<span>&nbsp;</span>";
      } else {
        spans += "<span>" + char + "</span>";
      }
    }
    heading.innerHTML = spans;

    gsap.to(selector + " > span", {
      scrollTrigger: {
        trigger: selector + " > span",
        start: "top bottom",
        end: "bottom top",
        scroller: "#main",
        scrub: 0.5,
      },
      stagger: 0.2,
      color: "#F4E7C1"
    });
  } catch (err) {
    heading.style.color = "#F4E7C1";
  }
}

initSplitText("#page2 > h1");
initSplitText("#page4 > h1");
initSplitText("#page6 > h1");

// -------------------------------------------------------------------
// 04 HELPER: RESPONSIVE ASPECT-RATIO CANVAS PAINTER
// -------------------------------------------------------------------
function scaleImage(img, ctx) {
  if (!ctx || !img) return;
  var w = img.naturalWidth || img.width;
  var h = img.naturalHeight || img.height;
  if (!w || !h) return;

  try {
    var c = ctx.canvas;
    var hRatio = c.width / w;
    var vRatio = c.height / h;
    var ratio = Math.max(hRatio, vRatio);
    var centerShift_x = (c.width - w * ratio) / 2;
    var centerShift_y = (c.height - h * ratio) / 2;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(
      img,
      0,
      0,
      w,
      h,
      centerShift_x,
      centerShift_y,
      w * ratio,
      h * ratio
    );
  } catch (err) {
    // Non-fatal draw catch
  }
}

// -------------------------------------------------------------------
// 05 CANVAS 1: #page3 FRAME SEQUENCE (frames00007.png -> frames00202.png, 66 frames)
// -------------------------------------------------------------------
function initCanvasPage3() {
  var canvas = document.querySelector("#page3 > canvas");
  if (!canvas) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  setCanvasSize();

  var frameFiles = [];
  for (var i = 7; i <= 202; i += 3) {
    frameFiles.push("./frames" + String(i).padStart(5, "0") + ".png");
  }

  var frameCount = frameFiles.length;
  var images = [];
  var imageSeq = { frame: 0 };
  var lastLoadedIndex = 0;

  for (var j = 0; j < frameCount; j++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () {
        lastLoadedIndex = idx;
        if (imageSeq.frame === idx || (imageSeq.frame === 0 && idx === 0)) {
          render();
        }
      };
      img.onerror = function () {
        // Safe fallback: never crash or stop the application
      };
      img.src = frameFiles[idx];
      images.push(img);
    })(j);
  }

  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap && !prefersReducedMotion) {
    try {
      gsap.to(imageSeq, {
        frame: frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          scrub: 0.5,
          trigger: "#page3",
          start: "top top",
          end: "250% top",
          scroller: "#main",
        },
        onUpdate: render,
      });

      ScrollTrigger.create({
        trigger: "#page3",
        pin: true,
        scroller: "#main",
        start: "top top",
        end: "250% top",
      });
    } catch (e) {
      console.warn("Page 3 ScrollTrigger registration fallback:", e);
    }
  }

  if (images[0] && images[0].complete) {
    render();
  }

  window.addEventListener("resize", function () {
    setCanvasSize();
    render();
  });

  function render() {
    var targetImg = images[imageSeq.frame];
    if (!targetImg || !targetImg.complete || !(targetImg.naturalWidth || targetImg.width)) {
      targetImg = images[lastLoadedIndex] || images[0];
    }
    if (targetImg && targetImg.complete && (targetImg.naturalWidth || targetImg.width)) {
      scaleImage(targetImg, context);
    }
  }
}
initCanvasPage3();

// -------------------------------------------------------------------
// 06 CANVAS 2: #page5 BRIDGES SEQUENCE (bridges00004.png -> bridges00160.png, 53 frames)
// -------------------------------------------------------------------
function initCanvasPage5() {
  var canvas = document.querySelector("#page5 > canvas");
  if (!canvas) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  setCanvasSize();

  var frameFiles = [];
  for (var i = 4; i <= 160; i += 3) {
    frameFiles.push("./bridges" + String(i).padStart(5, "0") + ".png");
  }

  var frameCount = frameFiles.length;
  var images = [];
  var imageSeq = { frame: 0 };
  var lastLoadedIndex = 0;

  for (var j = 0; j < frameCount; j++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () {
        lastLoadedIndex = idx;
        if (imageSeq.frame === idx || (imageSeq.frame === 0 && idx === 0)) {
          render();
        }
      };
      img.onerror = function () {
        // Safe fallback: never crash or stop the application
      };
      img.src = frameFiles[idx];
      images.push(img);
    })(j);
  }

  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap && !prefersReducedMotion) {
    try {
      gsap.to(imageSeq, {
        frame: frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          scrub: 0.5,
          trigger: "#page5",
          start: "top top",
          end: "250% top",
          scroller: "#main",
        },
        onUpdate: render,
      });

      ScrollTrigger.create({
        trigger: "#page5",
        pin: true,
        scroller: "#main",
        start: "top top",
        end: "250% top",
      });
    } catch (e) {
      console.warn("Page 5 ScrollTrigger registration fallback:", e);
    }
  }

  if (images[0] && images[0].complete) {
    render();
  }

  window.addEventListener("resize", function () {
    setCanvasSize();
    render();
  });

  function render() {
    var targetImg = images[imageSeq.frame];
    if (!targetImg || !targetImg.complete || !(targetImg.naturalWidth || targetImg.width)) {
      targetImg = images[lastLoadedIndex] || images[0];
    }
    if (targetImg && targetImg.complete && (targetImg.naturalWidth || targetImg.width)) {
      scaleImage(targetImg, context);
    }
  }
}
initCanvasPage5();

// -------------------------------------------------------------------
// 07 CANVAS 3: #page7 SPATIAL TELEMETRY SEQUENCE (100% LOCAL ASSETS ONLY)
// -------------------------------------------------------------------
function initCanvasPage7() {
  var canvas = document.querySelector("#page7 > canvas");
  if (!canvas) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  setCanvasSize();

  // Option A implementation: Reuses verified local frames (zero remote requests)
  var frameFiles = [];
  for (var i = 7; i <= 202; i += 3) {
    frameFiles.push("./frames" + String(i).padStart(5, "0") + ".png");
  }

  var frameCount = frameFiles.length;
  var images = [];
  var imageSeq = { frame: 0 };
  var lastLoadedIndex = 0;

  for (var j = 0; j < frameCount; j++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () {
        lastLoadedIndex = idx;
        if (imageSeq.frame === idx || (imageSeq.frame === 0 && idx === 0)) {
          render();
        }
      };
      img.onerror = function () {
        // Safe fallback: never crash or stop the application
      };
      img.src = frameFiles[idx];
      images.push(img);
    })(j);
  }

  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap && !prefersReducedMotion) {
    try {
      gsap.to(imageSeq, {
        frame: frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          scrub: 0.5,
          trigger: "#page7",
          start: "top top",
          end: "250% top",
          scroller: "#main",
        },
        onUpdate: render,
      });

      ScrollTrigger.create({
        trigger: "#page7",
        pin: true,
        scroller: "#main",
        start: "top top",
        end: "250% top",
      });
    } catch (e) {
      console.warn("Page 7 ScrollTrigger registration fallback:", e);
    }
  }

  if (images[0] && images[0].complete) {
    render();
  }

  window.addEventListener("resize", function () {
    setCanvasSize();
    render();
  });

  function render() {
    var targetImg = images[imageSeq.frame];
    if (!targetImg || !targetImg.complete || !(targetImg.naturalWidth || targetImg.width)) {
      targetImg = images[lastLoadedIndex] || images[0];
    }
    if (targetImg && targetImg.complete && (targetImg.naturalWidth || targetImg.width)) {
      scaleImage(targetImg, context);
    }
  }
}
initCanvasPage7();

// -------------------------------------------------------------------
// 08 SPATIAL TELEMETRY CIRCLE ANIMATIONS (#page7)
// -------------------------------------------------------------------
if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !prefersReducedMotion) {
  try {
    if (document.querySelector(".page7-cir")) {
      gsap.to(".page7-cir", {
        scrollTrigger: {
          trigger: ".page7-cir",
          start: "top center",
          end: "bottom top",
          scroller: "#main",
          scrub: 0.5,
        },
        scale: 1.5,
      });
    }

    if (document.querySelector(".page7-cir-inner")) {
      gsap.to(".page7-cir-inner", {
        scrollTrigger: {
          trigger: ".page7-cir-inner",
          start: "top center",
          end: "bottom top",
          scroller: "#main",
          scrub: 0.5,
        },
        backgroundColor: "rgba(11, 31, 58, 0.45)",
      });
    }
  } catch (e) {}
}

// -------------------------------------------------------------------
// 09 NEXORA PRODUCT UI / UX CONTROLLER
// -------------------------------------------------------------------
;(function initNexoraUI() {
    var lastFocusedElement = null;

    // Helper: Smooth Scroll to any section using Locomotive Scroll or native fallback
    function scrollToTarget(targetSelector) {
        if (!targetSelector || targetSelector === "#") return;
        var targetEl = document.querySelector(targetSelector);
        if (!targetEl) return;

        if (window.locoScrollInstance && typeof window.locoScrollInstance.scrollTo === "function") {
            try {
                window.locoScrollInstance.scrollTo(targetEl, {
                    offset: 0,
                    duration: 1.2
                });
                return;
            } catch (err) {}
        }
        targetEl.scrollIntoView({ behavior: "smooth" });
    }

    // Bind Smooth Scroll to all in-page anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener("click", function(e) {
            var href = this.getAttribute("href");
            if (href && href.length > 1 && href.startsWith("#")) {
                e.preventDefault();
                closeMobileNav();
                scrollToTarget(href);
            }
        });
    });

    // Hero Explore & Scroll Buttons
    var exploreBtn = document.getElementById("hero-explore-btn");
    if (exploreBtn) {
        exploreBtn.addEventListener("click", function() {
            var target = this.getAttribute("data-target") || "#page2";
            scrollToTarget(target);
        });
    }

    var scrollBtn = document.getElementById("hero-scroll-btn");
    if (scrollBtn) {
        scrollBtn.addEventListener("click", function() {
            scrollToTarget("#page2");
        });
        scrollBtn.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToTarget("#page2");
            }
        });
    }

    /* --- MOBILE DRAWER NAVIGATION --- */
    var mobileDrawer = document.getElementById("mobile-nav");
    var menuBtn = document.getElementById("menu-btn");
    var mobileCloseBtn = document.getElementById("menu-close-btn");

    function openMobileNav() {
        if (!mobileDrawer) return;
        lastFocusedElement = document.activeElement;
        mobileDrawer.classList.add("is-open");
        mobileDrawer.setAttribute("aria-hidden", "false");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";

        if (window.locoScrollInstance && typeof window.locoScrollInstance.stop === "function") {
            try { window.locoScrollInstance.stop(); } catch (e) {}
        }

        var firstLink = mobileDrawer.querySelector(".drawer-nav-link");
        if (firstLink) {
            setTimeout(function() { firstLink.focus(); }, 100);
        }
    }

    function closeMobileNav() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.remove("is-open");
        mobileDrawer.setAttribute("aria-hidden", "true");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";

        if (window.locoScrollInstance && typeof window.locoScrollInstance.start === "function") {
            try { window.locoScrollInstance.start(); } catch (e) {}
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (mobileDrawer && mobileDrawer.classList.contains("is-open")) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            closeMobileNav();
            if (menuBtn) menuBtn.focus();
        });
    }

    /* --- EXECUTIVE DEMO REQUEST MODAL --- */
    var demoModal = document.getElementById("demo-modal");
    var modalBackdrop = document.getElementById("modal-backdrop-trigger");
    var modalCloseBtn = document.getElementById("modal-close-btn");
    var modalFormView = document.getElementById("modal-form-view");
    var modalSuccessView = document.getElementById("modal-success-view");
    var demoForm = document.getElementById("demo-form");
    var modalDoneBtn = document.getElementById("modal-done-btn");

    var confirmNameEl = document.getElementById("confirm-name");
    var confirmCompanyEl = document.getElementById("confirm-company");
    var confirmScaleEl = document.getElementById("confirm-scale");
    var confirmInterestEl = document.getElementById("confirm-interest");

    function openDemoModal() {
        if (!demoModal) return;
        lastFocusedElement = document.activeElement;
        closeMobileNav();
        demoModal.classList.add("is-open");
        demoModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        if (window.locoScrollInstance && typeof window.locoScrollInstance.stop === "function") {
            try { window.locoScrollInstance.stop(); } catch (e) {}
        }

        var firstInput = document.getElementById("demo-name");
        if (firstInput) {
            setTimeout(function() {
                firstInput.focus();
            }, 100);
        }
    }

    function closeDemoModal() {
        if (!demoModal) return;
        demoModal.classList.remove("is-open");
        demoModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        if (window.locoScrollInstance && typeof window.locoScrollInstance.start === "function") {
            try { window.locoScrollInstance.start(); } catch (e) {}
        }

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    // Bind all buttons that trigger the demo modal
    var demoTriggerSelectors = [
        "#book-demo-btn",
        "#hero-demo-btn",
        "#nav-drawer-demo-btn",
        "#book-demo-bottom-btn"
    ];

    demoTriggerSelectors.forEach(function(sel) {
        var btn = document.querySelector(sel);
        if (btn) {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                openDemoModal();
            });
        }
    });

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            closeDemoModal();
        });
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", function() {
            closeDemoModal();
        });
    }

    if (modalDoneBtn) {
        modalDoneBtn.addEventListener("click", function() {
            closeDemoModal();
            setTimeout(function() {
                if (modalFormView) modalFormView.style.display = "block";
                if (modalSuccessView) modalSuccessView.style.display = "none";
                if (demoForm) demoForm.reset();
            }, 350);
        });
    }

    // Form Submission Handling
    if (demoForm) {
        demoForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var nameInput = document.getElementById("demo-name");
            var companyInput = document.getElementById("demo-company");
            var nameVal = nameInput ? nameInput.value.trim() : "";
            var companyVal = companyInput ? companyInput.value.trim() : "";
            var scaleSelect = document.getElementById("demo-scale");
            var interestSelect = document.getElementById("demo-interest");

            var scaleVal = (scaleSelect && scaleSelect.selectedIndex >= 0)
                ? scaleSelect.options[scaleSelect.selectedIndex].text
                : "Commercial Asset";
            var interestVal = (interestSelect && interestSelect.selectedIndex >= 0)
                ? interestSelect.options[interestSelect.selectedIndex].text
                : "3D Spatial Digital Twin";

            if (confirmNameEl) confirmNameEl.textContent = nameVal || "Executive Guest";
            if (confirmCompanyEl) confirmCompanyEl.textContent = companyVal || "Your Organization";
            if (confirmScaleEl) confirmScaleEl.textContent = scaleVal;
            if (confirmInterestEl) confirmInterestEl.textContent = interestVal;

            if (modalFormView) modalFormView.style.display = "none";
            if (modalSuccessView) modalSuccessView.style.display = "flex";
        });
    }

    // Global keyboard listener (Escape key closes drawer & modal)
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (demoModal && demoModal.classList.contains("is-open")) {
                closeDemoModal();
            } else if (mobileDrawer && mobileDrawer.classList.contains("is-open")) {
                closeMobileNav();
            }
        }
    });
})();
