import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let PendingViolations = {};
PendingViolations.pageIndex = 1;
PendingViolations.destroyTable = false;

PendingViolations.getPendingViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number($("#violationSector").children("option:selected").val()),
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  // Check if theCode field has a value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    $(".PreLoader").removeClass("active");
    return;
  }

  const theCode = violationCategoryValue == "Quarry"
    ? { QuarryCode: $("#theCode").val() }
    : { CarNumber: $("#theCode").val() };

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Pending",
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      PaymentStatus: "",
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: ViolationGeneralSearch,
      Sector: 0,
      OffenderType: $("#violationCategory").val(),
      ViolationsZone: $("#violationZone").val(),
      CreatedFrom: $("#createdFrom").val()
        ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
      CreatedTo: $("#createdTo").val()
        ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
    },
  };

  functions
    .requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".PreLoader").removeClass("active");
      let Pendingviolation = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            Pendingviolation.push(element);
          });
        } else {
          Pendingviolation = [];
        }
      }

      PendingViolations.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      PendingViolations.PendingviolationTable(Pendingviolation, destroyTable);
      PendingViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", PendingViolations.getPendingViolations);
  pagination.activateCurrentPage();
};

PendingViolations.filterViolationsLog = (e) => {
  let pageIndex = PendingViolations.pageIndex;

  let ViolationSectorVal = $("#violationSector")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  // Check if theCode has value but violationCategory is empty
  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    return;
  }

  let ViolationType;
  let ViolationSector;

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    ViolationSectorVal != "" ||
    ViolationTypeVal != "0" ||
    ViolationGeneralSearch != ""
  ) {
    $(".PreLoader").addClass("active");
    ViolationSector = Number(
      $("#violationSector").children("option:selected").val()
    );
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    PendingViolations.getPendingViolations(
      pageIndex,
      true,
      ViolationSector,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

PendingViolations.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#violationSector").val("0");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  PendingViolations.getPendingViolations();
};

PendingViolations.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val("");
      $typeOfViolationField.prop("disabled", true).val("0");
    } else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0");
    }
  });
};

const originalResetFilter = PendingViolations.resetFilter;
PendingViolations.resetFilter = function (e) {
  originalResetFilter.call(this, e);
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);
};

PendingViolations.exportToExcel = () => {
  // Get current filter values
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  const theCode = {};
  if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
    if (violationCategoryValue === "Quarry") {
      theCode.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      theCode.CarNumber = theCodeValue;
    }
  }

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: "Pending",
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
    SectorConfigId: Number($("#violationSector").children("option:selected").val()),
    GlobalSearch: $("#violationSearch").val(),
    OffenderType: $("#violationCategory").val(),
    ViolationsZone: $("#violationZone").val(),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

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
        if (!violation) return "---";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "---") : (violation.QuarryCode || "---");
      },
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
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "المخالفات قيد الانتظار.xlsx",
    sheetName: "المخالفات قيد الانتظار",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#PendingViolation"
  });
};

PendingViolations.PendingviolationTable = (Pendingviolation, destroyTable) => {
  let data = [];
  let taskViolation;
  if (Pendingviolation.length > 0) {
    Pendingviolation.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      if (taskViolation) {
        const rejectedIndicator = taskViolation.IsRejectedBefore ?
          '<span class="rejected-indicator" title="تم رفضها سابقاً"></span> ' :
          '';

        data.push([
          `<div class="violationId" style="display: flex;align-items: center;" data-taskid="${record.ID}" data-violationid="${taskViolation?.ID}" data-offendertype=${taskViolation.OffenderType} data-violationcode="${taskViolation.ViolationCode}">
            ${rejectedIndicator}${taskViolation.ViolationCode || "----"}
          </div>`,
          `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                      <li><a href="#" data-violationid="${taskViolation?.ID}" data-violationcode="${taskViolation?.ViolationCode}" class="violationHistory" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>
                  </ul>
              </div>
          </div>`,
          `<div class="violationArName">${functions.getViolationArabicName(
            taskViolation.OffenderType
          )}</div>`,
          `<div class="violationCode" data-offendertype="${taskViolation.OffenderType}">${taskViolation.OffenderType == "Vehicle"
            ? taskViolation.CarNumber
            : taskViolation.QuarryCode != ""
              ? taskViolation.QuarryCode
              : "---"
          }</div>`,
          `<div class="companyName">${taskViolation.ViolatorCompany != ""
            ? taskViolation.ViolatorCompany
            : "-"
          }</div>`,
          `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
            ? taskViolation.ViolationTypes.ID
            : 0
          }">${functions.getViolationArabicName(
            taskViolation.OffenderType,
            taskViolation?.ViolationTypes?.Title
          )}</div>`,
          `<div class="violationZone">${taskViolation.ViolationsZone || "----"}</div>`,
          `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
          `${createdDate}`,
        ]);
      }
    });
  }

  if (PendingViolations.destroyTable || destroyTable) {
    $("#PendingViolation").DataTable().destroy();
  }

  let Table = functions.tableDeclare(
    "#PendingViolation",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: " رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "المخالفات قيد الانتظار.xlsx",
    "المخالفات قيد الانتظار"
  );

  functions.createColumnSelector(Table, "#columnSelector", 'green');
  PendingViolations.destroyTable = true;

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    PendingViolations.exportToExcel();
  });

  let violationlog = Table.rows().nodes().to$();
  let UserId = _spPageContextInfo.userId;

  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails = null;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        UserDetails = User;
      }
    });

    $.each(violationlog, (index, record) => {
      let jQueryRecord = $(record);
      let taskID = jQueryRecord.find(".violationId").data("taskid");
      let violationId = jQueryRecord.find(".violationId").data("violationid");
      let violationCode = jQueryRecord.find(".violationId").data("violationcode");
      let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".controlsList").append(`
        <li><a href="#" class="ApprovedViolation">قبول المخالفة</a></li> 
        <li><a href="#" class="RejectedViolations">رفض المخالفة</a></li>   
    `);

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".itemDetails")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          PendingViolations.findViolationByID(
            e,
            taskID,
            false,
            UserDetails ? UserDetails.JobTitle1 : ""
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".ApprovedViolation")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          PendingViolations.approveTaskPopup(
            taskID,
            violationCode,
            violationId
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".editMaterialMinPrice")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          PendingViolations.editMinPriceTaskPopup(
            taskID,
            violationCode,
            violationId
          );
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".RejectedViolations")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          PendingViolations.RejectTaskPopup(violationCode, taskID, violationId);
        });
      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".printViolationDetails")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          $(".detailsPopupForm").addClass("pendingViolations");
          PendingViolations.findViolationByID(e, taskID, true);
        });
    });

    // Use event delegation to handle clicks on dynamically added elements
    $(document).on("click", ".ellipsisButton", function (e) {
      e.stopPropagation();
      $(".hiddenListBox").hide(300);
      $(this).siblings(".hiddenListBox").toggle(300);
    });
  });

  functions.hideTargetElement(".controls", ".hiddenListBox");
};

PendingViolations.findViolationByID = (
  event,
  taskID,
  print = false,
  UserJopTitle = ""
) => {
  let request = {
    Id: taskID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData;
      let violationId;
      let violationOffenderType;
      let Content;
      let printBox;
      let violationCode;
      let violationTypeId;
      let materialMinPrice;
      let materialTitle;

      if (data != null) {
        violationData = data.d.Violation;
        violationId = data.d.ViolationId;
        violationOffenderType = violationData.OffenderType;
        violationCode = violationData.ViolationCode;
        violationTypeId = violationData?.ViolationTypes?.ID;
        materialMinPrice = violationData?.Material?.MinPrice;
        materialTitle = violationData?.Material?.Title;

        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "قيد الانتظار"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "قيد الانتظار"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "قيد الانتظار"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        }
        functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });

        if (print) {
          functions.PrintDetails(event);
        }
        $(".detailsPopupForm").addClass("pendingViolations");
        $(".detailsPopupForm")
          .find(".CommiteeMembersBox")
          .show()
          .find(".formElements")
          .css("border-bottom", "none");
        if (UserJopTitle == "فرع المخالفات") {
          $(".editMaterialMinPrice").css("display", "none");
          if (violationTypeId == 1 || violationTypeId == 5) {
            $(".editMaterialMinPrice").css("display", "flex");
            $(".editMaterialMinPrice").on("click", (e) => {
              PendingViolations.editMinPriceTaskPopup(
                taskID,
                violationCode,
                violationId,
                materialMinPrice,
                materialTitle
              );
            });
          }
          $(".approveViolation").css("display", "flex");
          $(".rejectViolation").css("display", "flex");

          $(".approveViolation").on("click", (e) => {
            PendingViolations.approveTaskPopup(
              taskID,
              violationCode,
              violationId
            );
          });

          $(".rejectViolation").on("click", (e) => {
            PendingViolations.RejectTaskPopup(
              violationCode,
              taskID,
              violationId
            );
          });
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.approveTaskPopup = (
  violationTaskID,
  violationCode,
  violationId
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
      <div class="popupHeader" style="display: flex; justify-content: space-between;">
          <div class="violationsCode"> 
              <p>قبول المخالفة رقم (${violationCode})</p>
          </div>
          <div class="btnStyle cancelBtn popupBtn closeApprovePopup" id="closeApprovePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
              <i class="fa-solid fa-x"></i>
          </div>
      </div>
      <div class="popupBody">
          <div class="confirmStatusPopup" id="confirmStatusPopup">
              <div class="popupContent">
                  <p class="popupMessage">هل حقاً تريد تأكيد قبول المخالفة رقم (${violationCode}) ؟</p>
              </div>
              <div class="formButtonsBox">
                  <div class="row">
                      <div class="col-12">
                          <div class="buttonsBox centerButtonsBox ">
                              <div class="btnStyle confirmBtnGreen popupBtn approveVioltionTaskBtn" id="approveVioltionTaskBtn">تأكيد</div>
                              <div class="btnStyle cancelBtn popupBtn" id="closeApprovePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  `;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "statusPopup"],
    popupHtml
  );

  $("#closeApprovePopup, #closeApprovePopupFooter").on("click", function () {
    functions.closePopup();
  });

  $(".approveVioltionTaskBtn").on("click", (e) => {
    e.preventDefault();
    $(".overlay").addClass("active");
    PendingViolations.approveTaskAction(violationTaskID, violationId);
  });
};

PendingViolations.editMinPriceTaskPopup = (
  violationTaskID,
  violationCode,
  violationId,
  materialMinPrice,
  materialTitle
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
      <div class="popupHeader" style="display: flex; justify-content: space-between;">
          <div class="violationsCode"> 
              <p>تعديل الحد الأدنى للمخالفة رقم (${violationCode})</p>
          </div>
          <div class="btnStyle cancelBtn popupBtn closeEditMinPricePopup" id="closeEditMinPricePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
              <i class="fa-solid fa-x"></i>
          </div>
      </div>
      <div class="popupBody">
          <div class="confirmStatusPopup" id="confirmStatusPopup">
              <div class="popupContent">
                  <p class="popupMessage">هل حقاً تريد تعديل الحد الأدنى لخام (${materialTitle}) ؟</p>
                  <div class="popupContent">
                  <input class="popupMessage" type="number" id="materialMinPriceInput" value=${materialMinPrice} placeholder="الحد الأدنى للمادة الخام"/>
                  </div>
                  <div id="loadingSpinner" style="display: none;">Loading...</div>
              </div>
              <div class="formButtonsBox">
                  <div class="row">
                      <div class="col-12">
                          <div class="buttonsBox centerButtonsBox ">
                              <div class="btnStyle confirmBtnGreen popupBtn approveVioltionTaskBtn" id="approveVioltionTaskBtn">تأكيد</div>
                              <div class="btnStyle cancelBtn popupBtn" id="closeEditMinPricePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  `;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "statusPopup"],
    popupHtml
  );

  $("#closeEditMinPricePopup, #closeEditMinPricePopupFooter").on("click", function () {
    functions.closePopup();
  });

  $(".approveVioltionTaskBtn").on("click", (e) => {
    let newMaterialMinPrice = parseFloat($("#materialMinPriceInput").val());
    e.preventDefault();
    $(".overlay").addClass("active");
    PendingViolations.approveEditMaterialMinPrice(
      violationTaskID,
      violationId,
      newMaterialMinPrice
    );
  });
};

/// getCustomMaterialMinPrice

// PendingViolations.GetMaterialMinPrice = (violationId) => {
//   let request = { id: violationId };

//   return functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/GetMaterialMinPrice", request)
//     .then((response) => {
//       if (response.ok) {
//         return response.json(); // Returns a promise
//       } else {
//         throw new Error("Failed to fetch data");
//       }
//     })
//     .then((data) => {
//       let materialMinPrice = null;
//       if (data != null && data.d && data.d.Result) {
//         materialMinPrice = data.d.Result;  // Get the price from the response
//         // console.log("from main funtction",materialMinPrice)
//       }
//       return materialMinPrice;  // Return the materialMinPrice
//     })
//     .catch((err) => {
//       console.error("Error fetching material price:", err);
//       return null;  // Return null in case of error
//     });
// };

// PendingViolations.GetMaterialMinPrice = (violationId) => {
//   let request = {
//       id: violationId
//   }
//   functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/GetMaterialMinPrice", request )
//     .then((response) => {
//       if (response.ok) {
//         return response.json();
//       }
//     })
//     .then((data) => {
//       let materialMinPrice;
//       if (data != null) {
//         materialMinPrice = data.d.Result;
//       } else {
//         materialMinPrice = null;
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };
/// ApproveEditMaterialMinPrice
PendingViolations.approveEditMaterialMinPrice = (
  violationTaskID,
  violationId,
  newMaterialMinPrice
) => {
  let request = {
    Data: {
      ID: violationTaskID,
      Title: "تم الموافقة على الطلب مع التعديل",
      Status: "Approved",
      ViolationId: violationId,
      PaymentStatus: "قيد الإنتظار",
      customMaterialMinprice: newMaterialMinPrice,
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert(
        "تم الموافقة على الطلب مع تعديل قيمة الحد الأدنى للمادة الخام"
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.approveTaskAction = (violationTaskID, violationId) => {
  let request = {
    Data: {
      ID: violationTaskID,
      Title: "تم الموافقة على الطلب",
      Status: "Approved",
      ViolationId: violationId,
      PaymentStatus: "قيد الإنتظار",
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم الموافقة على الطلب");
    })
    .catch((err) => {
      console.log(err);
    });
};

PendingViolations.RejectTaskPopup = (violationCode, taskID, violationId) => {
  $(".overlay").removeClass("active");
  let popupHtml = ` 
      <div class="popupHeader" style="display: flex; justify-content: space-between;">
          <div class="violationsCode"> 
              <p> كود المخالفة رقم (${violationCode})</p>
          </div>
          <div class="btnStyle cancelBtn popupBtn closeRejectPopup" id="closeRejectPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
              <i class="fa-solid fa-x"></i>
          </div>
      </div>
      <div class="popupBody">
          <div class="popupForm detailsPopupForm" id="detailsPopupForm">
              
            <div class="formContent">
                <div class="formBox">
                    <div class="formElements">
                        <div class="row">
                            <div class="col-12">
                                <div class="form-group customFormGroup">
                                    <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                    <textarea class="form-control rejectReason customTextArea" id="rejectReason" placeholder="ادخل سبب الرفض"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="formButtonsBox">
                <div class="row">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox ">
                            <div class="btnStyle confirmBtnGreen popupBtn rejectBtn" id="rejectBtn">تأكيد</div>
                            <div class="btnStyle cancelBtn popupBtn" id="closeRejectPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
`;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml
  );

  $("#closeRejectPopup, #closeRejectPopupFooter").on("click", function () {
    functions.closePopup();
  });

  let rejectComment = $(".rejectReason").val();
  $(".rejectReason").on("keyup", (e) => {
    rejectComment = $(e.currentTarget).val();
  });

  $(".rejectBtn").on("click", (e) => {
    e.preventDefault();
    if (rejectComment != "") {
      $(".overlay").addClass("active");
      PendingViolations.RejectTaskAction(taskID, violationId, rejectComment);
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب الرفض أولا");
    }
  });
};

PendingViolations.RejectTaskAction = (taskID, violationId, rejectComment) => {
  let request = {
    Data: {
      Title: "تم رفض المخالفة",
      Status: "Rejected",
      ID: taskID,
      ViolationId: violationId,
      Comment: rejectComment,
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم رفض المخالفة");
    })
    .catch((err) => {
      console.log(err);
    });
};

const ViolationHistoryLogs = () => {
  let selectedViolationId = null;
  let selectedViolationCode = null;
  let trackHistoryTable = null;

  // ===============================
  // 🔥 فتح المودال
  // ===============================
  $(".contentContainer").on("click", ".violationHistory", function (e) {
    e.preventDefault();
    e.stopPropagation();

    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");

    $("#trackHistoryModal").modal("show");
  });

  // ===============================
  // 🔥 إغلاق المودال - Close button handlers
  // ===============================
  const closeModal = () => {
    $("#trackHistoryModal").modal("hide");

    // Clear the modal content
    $(".track-history-violation-code").text("");
    if (trackHistoryTable) {
      trackHistoryTable.clear().destroy();
      trackHistoryTable = null;
    }
    $("#trackHistoryTable tbody").empty();
  };

  $(document).on("click", "#closeViolationHistoryPopup", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  // // Close button in footer
  // $(document).on("click", "#closeViolationHistoryPopupFooter", function (e) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   closeModal();
  // });

  // Bootstrap modal hide event
  $("#trackHistoryModal").on("hidden.bs.modal", function () {
    closeModal();
  });

  // ===============================
  // 🔥 لما المودال يفتح
  // ===============================
  $(".track-history-modal").on("shown.bs.modal", function () {
    $(".track-history-violation-code").text(selectedViolationCode);

    const request = {
      Request: {
        ViolationId: selectedViolationId,
      },
    };

    const tableElement = $("#trackHistoryTable");

    // ✅ لو أول مرة نعمل init
    if (!trackHistoryTable) {
      trackHistoryTable = tableElement.DataTable({
        processing: true,
        paging: false,
        responsive: true,
        destroy: true,
        ajax: {
          url: "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
          type: "POST",
          contentType: "application/json",
          data: () => JSON.stringify(request),
          dataSrc: (data) => {
            return data?.d?.Result?.GridData || [];
          }
        },
        columns: [
          { data: null, render: (data, type, row, meta) => meta.row },
          { data: "Status", render: (data) => data || "-" },
          { data: "Created", render: (data) => data ? functions.getFormatedDate(data) : "-" },
          { data: "CreatedBy", render: (data) => data || "-" },
          { data: "Comment", render: (data) => data || "-" }
        ],
        language: { emptyTable: "لا توجد بيانات" }
      });
    } else {
      trackHistoryTable.ajax.reload();
    }
  });

  // ===============================
  // 🔥 لما المودال يقفل
  // ===============================
  $(".track-history-modal").on("hidden.bs.modal", function () {
    $(".track-history-violation-code").text("");
    if (trackHistoryTable) {
      trackHistoryTable.clear().destroy();
      trackHistoryTable = null;
    }
    $("#trackHistoryTable tbody").empty();
  });
};

ViolationHistoryLogs();

export default PendingViolations;






