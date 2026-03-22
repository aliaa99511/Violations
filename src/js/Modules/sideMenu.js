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
// Fetch Navigation + Counters
// ==========================
sideMenuFunctions.getOnlyVisibleNavSubsites = async function () {

  try {

    const rootUrl = window.location.href.split("/Pages/")[0];
    let UserId = _spPageContextInfo.userId;

    const currentPage = this.normalizeUrl(window.location.pathname);

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

    const [navResponse, countersResponse] = await Promise.all([

      $.ajax({
        url: rootUrl + "/_api/web/navigation/QuickLaunch?$select=Title,Url,Children&$expand=Children",
        method: "GET",
        headers: { Accept: "application/json;odata=verbose" }
      }),

      $.ajax({
        url: "/_layouts/15/Uranium.Violations.SharePoint/Dashboard.aspx/GetCounters",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(payload)
      })

    ]);

    this.counters = countersResponse?.d?.Result?.Counters || {};

    const arabicPages = navResponse.d.results.filter(link =>
      /[\u0600-\u06FF]/.test(link.Title)
    );

    this.attachCountersToNavigation(arabicPages);

    return arabicPages;

  } catch (error) {
    console.error("Navigation error:", error);
    return [];
  }
};


// ==========================
// Attach Counters To Navigation
// ==========================
sideMenuFunctions.attachCountersToNavigation = function (items) {

  if (!Array.isArray(items)) return;

  items.forEach(item => {

    this.attachCounterToItem(item);

    if (item.Children?.results?.length) {
      item.Children.results.forEach(child => {
        this.attachCounterToItem(child);
      });
    }

  });

};


// ==========================
// Attach Counter To Single Item
// ==========================
sideMenuFunctions.attachCounterToItem = function (item) {

  if (!this.counters) return;

  const normalizedUrl = this.normalizeUrl(item.Url);
  const mapping = this.normalizedCounterMapping[normalizedUrl];

  if (!mapping) return;

  let total = 0;
  const counterType = this.counters[mapping.type];

  if (!counterType) return;

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

  if (total !== undefined) {
    item.Count = total;
  }

};


// ==========================
// Render Menu
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

        const count = child.Count;

        html += `<li class="submenu-item ${childActive}">
          <a href="${child.Url}">
            <span>${child.Title}</span>
            ${count !== undefined ? `<span class="count-badge">${count}</span>` : ""}
          </a>
        </li>`;
      });

      html += "</ul></li>";

    } else {

      const count = item.Count;

      html += `<li class="${itemClass} ${activeClass}">
        <a href="${item.Url}" class="menu-link">
          <span>${item.Title}</span>
          ${count !== undefined ? `<span class="count-badge">${count}</span>` : ""}
        </a>
      </li>`;
    }

  });

  html += "</ul>";

  menuContainer.html(html);

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
// Init
// ==========================
sideMenuFunctions.init = function () {

  this.getOnlyVisibleNavSubsites()
    .then(nav => this.renderNavigationMenu(nav));

};

export default sideMenuFunctions;