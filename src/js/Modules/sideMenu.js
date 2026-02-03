const sideMenuFunctions = {};

sideMenuFunctions.getOnlyVisibleNavSubsites = async function () {
  try {
    // Get the root URL by splitting at '/Pages/' as requested
    const rootUrl = window.location.href.split("/Pages/")[0];

    const navResponse = await $.ajax({
      url:
        rootUrl +
        "/_api/web/navigation/QuickLaunch?$select=Title,Url,Children&$expand=Children",
      method: "GET",
      caches: true,
      headers: { Accept: "application/json;odata=verbose" },
    });

    // Filter to return only pages with Arabic titles
    const arabicPages = navResponse.d.results.filter((link) =>
      /[\u0600-\u06FF]/.test(link.Title)
    );

    return arabicPages;
  } catch (error) {
    console.error("Error fetching visible navigation subsites:", error);
    return [];
  }
};

sideMenuFunctions.renderNavigationMenu = function (navigationData) {
  const currentPage = window.location.pathname;
  const menuContainer = $(".SideMenu .menuLinksBox");

  if (!menuContainer.length) {
    console.error("Menu container not found");
    return;
  }

  // Build the menu HTML
  let menuHTML = '<ul class="navigationMenu">';

  navigationData.forEach((item) => {
    const hasChildren =
      item.Children &&
      item.Children.results &&
      item.Children.results.length > 0;
    const isActive = currentPage === item.Url;

    // Check if any child is active
    let hasActiveChild = false;
    if (hasChildren) {
      hasActiveChild = item.Children.results.some(
        (child) => currentPage === child.Url
      );
    }

    const itemClass = hasChildren ? "menu-item has-children" : "menu-item";
    const activeClass = isActive || hasActiveChild ? "active" : "";

    if (hasChildren) {
      // Parent item with children (collapsible)
      menuHTML += `
        <li class="${itemClass} ${activeClass}">
          <div class="menu-header">
            <span class="menu-title">${item.Title}</span>
            <i class="fa-solid fa-angle-left"></i>
          </div>
          <ul class="submenu">`;

      // Add children
      item.Children.results.forEach((child) => {
        const childActive = currentPage === child.Url ? "active-child" : "";
        const childCount = child.Count || "";
        menuHTML += `
          <li class="submenu-item ${childActive}">
            <a href="${child.Url}">
              ${child.Title}
              ${childCount ? `<span class="count">${childCount}</span>` : ""}
            </a>
          </li>`;
      });

      menuHTML += `
          </ul>
        </li>`;
    } else {
      // Single item without children
      menuHTML += `
        <li class="${itemClass} ${activeClass}">
          <a href="${item.Url}" class="menu-link">
            ${item.Title}
          </a>
        </li>`;
    }
  });

  menuHTML += "</ul>";

  // Insert the menu into the container
  menuContainer.html(menuHTML);

  // Add collapse/expand functionality
  $(".menu-header").on("click", function () {
    const $parent = $(this).parent();
    const $submenu = $parent.find(".submenu");
    const $icon = $(this).find(".toggle-icon");

    // Toggle the submenu
    $submenu.slideToggle(300);
    $parent.toggleClass("expanded");

    // Rotate the icon
    if ($parent.hasClass("expanded")) {
      $icon.css("transform", "rotate(180deg)");
    } else {
      $icon.css("transform", "rotate(0deg)");
    }
  });

  // Auto-expand active items
  $(".menu-item.active.has-children").addClass("expanded");
  $(".menu-item.expanded .submenu").show();
  $(".menu-item.expanded .toggle-icon").css("transform", "rotate(180deg)");
};

export default sideMenuFunctions;
