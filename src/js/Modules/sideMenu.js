const sideMenuFunctions = {};

// ==========================
// Counter Mapping
// ==========================
const counterMapping = {

  // ==========================
  // Violations Branch
  // ==========================
  "/ViolationsBranch/Pages/PendingViolations.aspx": { type: "Violations", key: "Pending" },
  "/ViolationsBranch/Pages/RunningViolations.aspx": { type: "Violations", key: "Approved" },
  "/ViolationsBranch/Pages/RejectedViolations.aspx": { type: "Violations", key: "Rejected" },

  "/ViolationsBranch/Pages/ValidatedViolations.aspx": {
    type: "Violations",
    keys: ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled"]
  },

  "/ViolationsBranch/Pages/pendingPaymentLog.aspx": { type: "Violations", key: "UnderPayment" },
  "/ViolationsBranch/Pages/completedViolations.aspx": { type: "Violations", key: "Completed" },

  // Cases
  "/ViolationsBranch/Pages/CasesLog.aspx": {
    type: "Cases",
    keys: ["Quarry", "Vehicle", "Equipment"]
  },
  "/ViolationsBranch/Pages/quarryViolationReferral.aspx": { type: "Cases", key: "Quarry" },
  "/ViolationsBranch/Pages/CarViolationReferral.aspx": { type: "Cases", key: "Vehicle" },

  // Petitions
  "/ViolationsBranch/Pages/PendingPetitionsLog.aspx": { type: "Petitions", key: "التماس قيد الإنتظار" },
  "/ViolationsBranch/Pages/PetitionsLog.aspx": {
    type: "Petitions",
    keys: ["التماس مرفوض", "قبول مع التعديل", "قبول وإلغاء المخالفة"]
  },

  // ==========================
  // Certification Officer
  // ==========================
  "/CertificationOfficer/Pages/RunningViolations.aspx": { type: "Violations", key: "Approved" },

  "/CertificationOfficer/Pages/ConfirmedLog.aspx": {
    type: "Violations",
    keys: ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled"]
  },

  "/CertificationOfficer/Pages/CasesLog.aspx": {
    type: "Cases",
    keys: ["Quarry", "Vehicle", "Equipment"]
  },
  "/CertificationOfficer/Pages/QuarryViolationReferralSector.aspx": { type: "Cases", key: "Quarry" },
  "/CertificationOfficer/Pages/Block-Car-Equipment.aspx": { type: "Cases", key: "Vehicle" },

  "/CertificationOfficer/Pages/Pending-Petitions.aspx": { type: "Petitions", key: "التماس قيد الإنتظار" },
  "/CertificationOfficer/Pages/PetitionsLog.aspx": {
    type: "Petitions",
    keys: ["التماس مرفوض", "قبول مع التعديل", "قبول وإلغاء المخالفة"]
  },

  // ==========================
  // Violations Recorder
  // ==========================
  "/ViolationsRecorder/Pages/Registered-Violations.aspx": { type: "Violations", key: "Pending" },
  "/ViolationsRecorder/Pages/ApprovedViolationsRecords.aspx": { type: "Violations", key: "Approved" },

  "/ViolationsRecorder/Pages/ValidatedViolationsRecords.aspx": {
    type: "Violations",
    keys: ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled"]
  },

  "/ViolationsRecorder/Pages/QuarryViolationReferralRecords.aspx": { type: "Cases", key: "Quarry" },
  "/ViolationsRecorder/Pages/CarViolationReferralRecords.aspx": { type: "Cases", key: "Vehicle" },

  "/ViolationsRecorder/Pages/RejectedViolationsRecords.aspx": { type: "Violations", key: "Rejected" },
  "/ViolationsRecorder/Pages/Pending-Payment.aspx": { type: "Violations", key: "UnderPayment" }
};


// ==========================
// URL Normalizer
// ==========================
sideMenuFunctions.normalizeUrl = function (url) {
  if (!url) return "";
  return url.toLowerCase().split("?")[0].replace(/\/$/, "");
};


// ==========================
// Build Normalized Mapping
// ==========================
sideMenuFunctions.normalizedCounterMapping = {};

Object.keys(counterMapping).forEach(key => {
  const normalized = sideMenuFunctions.normalizeUrl(key);
  sideMenuFunctions.normalizedCounterMapping[normalized] = counterMapping[key];
});


// ==========================
// Fetch Navigation Only (Fast)
// ==========================
sideMenuFunctions.fetchNavigation = async function () {
  try {
    const rootUrl = window.location.href.split("/Pages/")[0];

    const navResponse = await $.ajax({
      url: rootUrl + "/_api/web/navigation/QuickLaunch?$select=Title,Url,Children&$expand=Children",
      method: "GET",
      headers: { Accept: "application/json;odata=verbose" }
    });

    const arabicPages = navResponse.d.results.filter(link =>
      /[\u0600-\u06FF]/.test(link.Title)
    );

    return arabicPages;

  } catch (error) {
    console.error("Navigation error:", error);
    return [];
  }
};


// ==========================
// Fetch Counters Only (Async after render)
// ==========================
sideMenuFunctions.fetchCounters = async function () {
  try {
    const currentPage = this.normalizeUrl(window.location.pathname);
    let UserId = _spPageContextInfo.userId;

    let payload = { Sector: 0 };

    // For Violations Recorder, we need to pass the UserId as Sector to get the correct counters
    const sectorPages = [
      "registered-violations.aspx",
      "pending-payment.aspx",
      "approvedviolationsrecords.aspx",
      "rejectedviolationsrecords.aspx",
      "validatedviolationsrecords.aspx"
    ];

    if (sectorPages.some(page => currentPage.includes(page))) {
      payload = { Sector: UserId };
    }

    const countersResponse = await $.ajax({
      url: "/_layouts/15/Uranium.Violations.SharePoint/Dashboard.aspx/GetCounters",
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(payload)
    });

    this.counters = countersResponse?.d?.Result?.Counters || {};

    // Update existing menu with counters
    this.updateCountersInMenu();

  } catch (error) {
    console.error("Counters error:", error);
  }
};


// ==========================
// Calculate Counter Value
// ==========================
sideMenuFunctions.calculateCounter = function (normalizedUrl) {
  if (!this.counters) return null;

  const mapping = this.normalizedCounterMapping[normalizedUrl];
  if (!mapping) return null;

  const counterType = this.counters[mapping.type];
  if (!counterType) return null;

  let total = 0;

  if (mapping.keys) {
    mapping.keys.forEach(key => {
      const value = counterType[key];
      if (value !== undefined && value !== null) {
        total += value;
      }
    });
  } else if (mapping.key) {
    const value = counterType[mapping.key];
    if (value !== undefined && value !== null) {
      total = value;
    }
  }

  return total !== undefined ? total : null;
};


// ==========================
// Update Counters in Already Rendered Menu
// ==========================
sideMenuFunctions.updateCountersInMenu = function () {
  const menuContainer = $(".SideMenu .menuLinksBox");

  // Update top-level items
  menuContainer.find(".menu-link").each((index, element) => {
    const $link = $(element);
    const url = $link.attr("href");

    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      const count = this.calculateCounter(normalizedUrl);

      if (count !== null) {
        // Remove existing badge if any
        $link.find(".count-badge").remove();

        // Add new badge
        $link.append(`<span class="count-badge">${count}</span>`);
      }
    }
  });

  // Update submenu items
  menuContainer.find(".submenu-item a").each((index, element) => {
    const $link = $(element);
    const url = $link.attr("href");

    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      const count = this.calculateCounter(normalizedUrl);

      if (count !== null) {
        // Remove existing badge if any
        $link.find(".count-badge").remove();

        // Add new badge
        $link.append(`<span class="count-badge">${count}</span>`);
      }
    }
  });
};


// ==========================
// Render Menu (Without Counters First)
// ==========================
sideMenuFunctions.renderNavigationMenu = function (data) {
  const currentPage = this.normalizeUrl(window.location.pathname);
  const menuContainer = $(".SideMenu .menuLinksBox");

  let html = '<ul class="navigationMenu">';

  data.forEach(item => {
    const hasChildren = item.Children?.results?.length > 0;
    const normalizedItemUrl = this.normalizeUrl(item.Url);
    const isActive = currentPage === normalizedItemUrl;

    let hasActiveChild = false;

    if (hasChildren) {
      hasActiveChild = item.Children.results.some(child =>
        currentPage === this.normalizeUrl(child.Url)
      );
    }

    const activeClass = isActive || hasActiveChild ? "active" : "";
    const itemClass = hasChildren ? "menu-item has-children" : "menu-item";

    if (hasChildren) {
      html += `<li class="${itemClass} ${activeClass}">
        <div class="menu-header">
          <span>${item.Title}</span>
          <i class="fa-solid fa-angle-left toggle-icon"></i>
        </div>
        <ul class="submenu">`;

      item.Children.results.forEach(child => {
        const childActive = currentPage === this.normalizeUrl(child.Url)
          ? "active-child"
          : "";

        // Render without count initially - will be updated later
        html += `<li class="submenu-item ${childActive}">
          <a href="${child.Url}">
            <span>${child.Title}</span>
          </a>
        </li>`;
      });

      html += "</ul></li>";

    } else {
      // Render without count initially - will be updated later
      html += `<li class="${itemClass} ${activeClass}">
        <a href="${item.Url}" class="menu-link">
          <span>${item.Title}</span>
        </a>
      </li>`;
    }
  });

  html += "</ul>";

  menuContainer.html(html);

  // Add event listeners
  $(".menu-header").on("click", function () {
    $(this).parent().toggleClass("expanded");
    $(this).next(".submenu").slideToggle(300);
  });

  $(".menu-item.active.has-children")
    .addClass("expanded")
    .children(".submenu")
    .show();
};


// ==========================
// Init - Render Fast, Then Fetch Counters
// ==========================
sideMenuFunctions.init = async function () {
  try {
    // Step 1: Fetch and render navigation immediately
    const navData = await this.fetchNavigation();
    this.renderNavigationMenu(navData);

    // Step 2: Fetch counters in background and update menu when ready
    // Don't await - let it run asynchronously
    this.fetchCounters().catch(err => console.error("Failed to fetch counters:", err));

  } catch (error) {
    console.error("Init error:", error);
  }
};

export default sideMenuFunctions;