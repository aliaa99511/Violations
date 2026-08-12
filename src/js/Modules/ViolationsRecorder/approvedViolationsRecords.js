import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";
import ViolationHistoryLogs from "../../Shared/ViolationHistoryLogs";

let approvedViolationsRecords = {};
// approvedViolationsRecords.pageIndex = 1;
approvedViolationsRecords.dataObj = {
  destroyTable: false,
  OffenderType: "",
  ViolationType: 0,
  GlobalSearch: "",
  ViolationCode: "",
  ViolationsZone: "",
  CarNumber: "",
  QuarryCode: "",
};
approvedViolationsRecords.getApprovedViolations = () => {
  let UserId = _spPageContextInfo.userId;

  const theCode =
    approvedViolationsRecords.dataObj.OffenderType === "Quarry"
      ? { QuarryCode: approvedViolationsRecords.dataObj.QuarryCode }
      : { CarNumber: approvedViolationsRecords.dataObj.CarNumber };

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Approved",
      Sector: UserId,
      ViolationType: approvedViolationsRecords.dataObj.ViolationType,
      OffenderType: approvedViolationsRecords.dataObj.OffenderType,
      GlobalSearch: approvedViolationsRecords.dataObj.GlobalSearch,
      ViolationCode: approvedViolationsRecords.dataObj.ViolationCode,
      ViolationsZone: approvedViolationsRecords.dataObj.ViolationsZone,
      TrailerNum: $("#trailerNum").val(),
      CreatedFrom: $("#createdFrom").val()
        ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
      CreatedTo: $("#createdTo").val()
        ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
    },
  };

  $(".overlay").addClass("active");

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
      { request }
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");

      let violationsData = [];
      let ItemsData = data.d.Result;

      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            violationsData.push(element);
          });
        } else {
          violationsData = [];
        }
      }

      approvedViolationsRecords.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );

      approvedViolationsRecords.dashBoardTable(violationsData);
      approvedViolationsRecords.dataObj.destroyTable = true;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};
approvedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", approvedViolationsRecords.getApprovedViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
approvedViolationsRecords.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();

    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");
    const $trailerNumField = $("#trailerNum");

    // Default: enable all
    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);
    $trailerNumField.prop("disabled", false);

    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val("");
      $typeOfViolationField.prop("disabled", true).val("0");
      $trailerNumField.prop("disabled", true).val("");
    }
    else if (selectedCategory === "Vehicle") {
      // Vehicle allows trailer number
      $typeOfViolationField.prop("disabled", true).val("0");
      $trailerNumField.prop("disabled", false);
    }
    else if (selectedCategory === "Quarry") {
      // Quarry doesn't allow trailer number
      $trailerNumField.prop("disabled", true).val("");
    }
    else {
      // No category selected
      $trailerNumField.prop("disabled", true).val("");
    }
  });
};
const originalResetFilter = approvedViolationsRecords.resetFilter;
approvedViolationsRecords.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#TypeofViolation").prop("disabled", false);

  // No category selected after reset
  $("#trailerNum").prop("disabled", true).val("");
};

approvedViolationsRecords.dashBoardTable = (violationsData) => {
  let data = [];
  let taskViolation;
  // let violationData;
  if (violationsData.length > 0) {
    violationsData.forEach(record => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      data.push([
        `<div class="violationId" data-violationid="${record.ViolationId}" data-taskid="${record.ID}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'>
                <div class='ellipsisButton'>
                    <i class='fa-solid fa-ellipsis-vertical'></i>
                </div>
                <div class="hiddenListBox">
                    <div class='arrow'></div>
                    <ul class='list-unstyled controlsList'>
                        <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>   
                        <li>
                          <a href="#"
                            data-violationid="${taskViolation?.ID}"
                            data-violationcode="${taskViolation?.ViolationCode}"
                            class="violationHistory"
                            data-toggle="modal"
                            data-target="#trackHistoryModal">
                            تتبع مرحلة المخالفة
                          </a>
                        </li>                    
                    </ul>
                </div>
            </div>`,
        `<div class="violationArName">${functions.getViolationArabicName(taskViolation.OffenderType)}</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle" ? taskViolation.CarNumber : taskViolation.QuarryCode != "" ? taskViolation.QuarryCode : "-"}</div>`,
        `<div class="trailerNum">${taskViolation?.TrailerNum || "-"}</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != "" ? taskViolation.ViolatorCompany : "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry" ? taskViolation.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `${createdDate}`,


      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#approvedViolationsRecordsTable",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "", class: "all no-sort" },
      { title: "تصنيف المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "رقم المقطورة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
      { title: "تاريخ الإنشاء", class: "sort" },
    ],
    false,
    approvedViolationsRecords.dataObj.destroyTable,
    "سجل المحاضر الموافق عليها.xlsx",
    "سجل المحاضر الموافق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'blue');

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    approvedViolationsRecords.exportToExcel();
  });

  // $(".ellipsisButton").on("click", (e) => {
  //   $(".hiddenListBox").hide(300);
  //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  // });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    // Toggle menu
    jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
      e.stopPropagation();
      const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
      $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
      currentBox.stop(true, true).toggle(300);
    });

    jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      approvedViolationsRecords.findViolationByID(e, taskID);
    });
    jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
      $(".overlay").addClass("active");
      approvedViolationsRecords.findViolationByID(e, taskID, true);
    });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
approvedViolationsRecords.exportToExcel = () => {
  // Get current filter values
  const currentFilters = {
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: "Approved",
    Sector: _spPageContextInfo.userId,
    ViolationType: approvedViolationsRecords.dataObj.ViolationType,
    OffenderType: approvedViolationsRecords.dataObj.OffenderType,
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    GlobalSearch: $("#violationSearch").val(),
    ViolationsZone: $("#violationZone").val(),
    TrailerNum: $("#trailerNum").val(),
    SectorConfigId: Number($("#violationSector").children("option:selected").val()),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

  // Add theCode field if applicable
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
    if (violationCategoryValue === "Quarry") {
      currentFilters.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      currentFilters.CarNumber = theCodeValue;
    }
  }

  // Define columns with their data mapping
  const columns = [
    {
      title: "رقم المخالفة",
      data: "Violation.ViolationCode",
    },
    {
      title: "",
      skip: true
    },
    {
      title: "تصنيف المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType),
    },
    {
      title: "رقم المحجر/العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "-";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "-") : (violation.QuarryCode || "-");
      },
    },
    {
      title: "رقم المقطورة",
      render: (record) =>
        record.Violation?.TrailerNum || "-",
    },
    {
      title: "إسم الشركة المخالفة",
      data: "Violation.ViolatorCompany",
    },
    {
      title: "نوع المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType, record.Violation?.ViolationTypes?.Title),
    },
    {
      title: "المنطقة",
      data: "Violation.ViolationsZone",
    },
    {
      title: "تاريخ الضبط",
      render: (record) => functions.getFormatedDate(record.Violation?.ViolationDate),
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) => functions.getFormatedDate(record.Created),
    },
    {
      title: "الإحداثيات",
      exportOnly: true,
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "-";

        // Try to get coordinates in degrees format first, fallback to regular format
        const coordinatesDegrees = violation.CoordinatesDegrees;
        const coordinates = violation.Coordinates;

        if (coordinatesDegrees) {
          // Parse the coordinates array and format them nicely
          try {
            const coordsArray = JSON.parse(coordinatesDegrees);
            if (Array.isArray(coordsArray) && coordsArray.length > 0) {
              return coordsArray.join(" | ");
            }
            return coordinatesDegrees;
          } catch (e) {
            return coordinatesDegrees;
          }
        }

        if (coordinates) {
          try {
            const coordsArray = JSON.parse(coordinates);
            if (Array.isArray(coordsArray) && coordsArray.length > 0) {
              return coordsArray.join(" | ");
            }
            return coordinates;
          } catch (e) {
            return coordinates;
          }
        }

        return "-";
      },
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "سجل المحاضر الموافق عليها.xlsx",
    sheetName: "سجل المحاضر الموافق عليها",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#approvedViolationsRecordsTable"
  });
};
approvedViolationsRecords.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId", request)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;
      if (data != null) {
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;

        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "الموافق عليها");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(["generalPopupStyle", "detailsPopup", "blueHeaderPopup"], printBox);
        }

        $(".detailsPopupForm").addClass("approvedViolationsRecordsLog")
        // $(".approvedViolationsRecordsLog").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom","none")

        // FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");

          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        // Hide edit button (extra safety)
        $("#editMaterialMinPrice").hide();

        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })

        if (print) {
          functions.PrintDetails(event)
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
approvedViolationsRecords.filterViolationsLog = (e) => {
  let OffenderTypeVal = $("#violationCategory").children("option:selected").val();
  let trailerNumValue = $("#trailerNum").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let GlobalSearchVal = $("#violationSearch").val();
  let ViolationCodeVal = $("#violationCode").val();
  let ViolationsZoneVal = $("#violationZone").val();
  let TheCodeVal = $("#theCode").val();
  let CreatedFromVal = $("#createdFrom").val();
  let CreatedToVal = $("#createdTo").val();

  if (
    (TheCodeVal?.trim() || trailerNumValue?.trim()) &&
    (!OffenderTypeVal || OffenderTypeVal === "")
  ) {
    functions.warningAlert(
      "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/مقطورة"
    );
    return;
  }

  if (
    OffenderTypeVal == "" &&
    ViolationTypeVal == "0" &&
    GlobalSearchVal == "" &&
    ViolationCodeVal == "" &&
    ViolationsZoneVal == "" &&
    TheCodeVal == "" &&
    CreatedFromVal == "" &&
    CreatedToVal == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
    return;
  }
  $(".overlay").addClass("active");
  approvedViolationsRecords.dataObj.OffenderType = OffenderTypeVal;
  approvedViolationsRecords.dataObj.ViolationType = Number(ViolationTypeVal);
  approvedViolationsRecords.dataObj.GlobalSearch = GlobalSearchVal;
  approvedViolationsRecords.dataObj.ViolationCode = ViolationCodeVal;
  approvedViolationsRecords.dataObj.ViolationsZone = ViolationsZoneVal;

  if (OffenderTypeVal === "Quarry") {
    approvedViolationsRecords.dataObj.QuarryCode = TheCodeVal;
    approvedViolationsRecords.dataObj.CarNumber = "";
  } else {
    approvedViolationsRecords.dataObj.CarNumber = TheCodeVal;
    approvedViolationsRecords.dataObj.QuarryCode = "";
  }

  approvedViolationsRecords.dataObj.destroyTable = true;
  approvedViolationsRecords.getApprovedViolations();
};
approvedViolationsRecords.resetFilter = (e) => {
  e.preventDefault();

  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#violationCode").val("");
  $("#theCode").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#trailerNum").val("");

  approvedViolationsRecords.dataObj = {
    destroyTable: true,
    OffenderType: "",
    ViolationType: 0,
    GlobalSearch: "",
    ViolationCode: "",
    ViolationsZone: "",
    CarNumber: "",
    QuarryCode: "",
  };

  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);

  pagination.reset();

  $(".overlay").addClass("active");

  approvedViolationsRecords.getApprovedViolations();
};


// ===============================
//  Violation History Tracking for External Violations
// ===============================
ViolationHistoryLogs.init(".contentContainer");


export default approvedViolationsRecords;
