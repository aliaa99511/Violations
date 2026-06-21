import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let validatedViolations = {};
validatedViolations.pageIndex = 1;
validatedViolations.destroyTable = false;

validatedViolations.getValidatedViolations = (
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
    $(".overlay").removeClass("active");
    return;
  }

  const theCode = violationCategoryValue == "Quarry"
    ? { QuarryCode: $("#theCode").val() }
    : { CarNumber: $("#theCode").val() };

  // Get selected status
  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  // Determine MultipleStatus based on selected status
  let multipleStatus = [];

  if (selectedStatus && selectedStatus !== "") {
    // If a specific status is selected, only use that status
    multipleStatus = [selectedStatus];
  } else {
    // If no status selected, use default list (excluding any you don't want)
    multipleStatus = ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled", "UnderReview", "UnderPayment"];
  }

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: selectedStatus, // Keep this for reference
      MultipleStatus: multipleStatus, // Use dynamic multipleStatus
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
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
  $(".overlay").addClass("active");
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      let ValidatedViolationData = [];

      let ItemsData = data.d.Result;
      if (data.d.Result?.GridData != null) {
        if (data.d.Result.GridData?.length > 0) {
          Array.from(data.d.Result?.GridData).forEach((element) => {
            ValidatedViolationData.push(element);
          });
        } else {
          ValidatedViolationData = [];
        }
      }
      validatedViolations.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage,);
      validatedViolations.ValidatedViolationTable(ValidatedViolationData, destroyTable);
      validatedViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};

validatedViolations.filterViolationsLog = (e) => {
  let pageIndex = validatedViolations.pageIndex;

  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

  // Check if theCode has value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

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
    $(".overlay").addClass("active");
    ViolationSector = Number($("#violationSector").children("option:selected").val());
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));

    validatedViolations.getValidatedViolations(
      pageIndex,
      true,
      ViolationSector,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};
validatedViolations.resetFilter = (e) => {
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
  $("#ViolationStatus").val("");

  $(".overlay").addClass("active");
  pagination.reset();
  validatedViolations.getValidatedViolations();
};
validatedViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolations.getValidatedViolations);
  pagination.activateCurrentPage();
};

validatedViolations.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    // First, enable both fields
    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val(""); // Disable and clear the field
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }

    // Handle "Vehicle" selection
    else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
      // theCode field remains enabled
    }
  });
};
const originalResetFilter = validatedViolations.resetFilter;
validatedViolations.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);
};


/////////////////////////////////////////
validatedViolations.exportToExcel = () => {
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

  // Get selected status
  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  // Determine MultipleStatus based on selected status
  let multipleStatus = [];

  if (selectedStatus && selectedStatus !== "") {
    // If a specific status is selected, only use that status
    multipleStatus = [selectedStatus];
  } else {
    // If no status selected, use default list
    multipleStatus = [
      "Confirmed",
      "Paid",
      "Exceeded",
      "Paid After Reffered",
      "Saved",
      "Cancelled"
    ];
  }

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: selectedStatus,
    MultipleStatus: multipleStatus,
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

  const allColumns = [
    {
      title: "رقم المخالفة",
      render: (record) => record.Violation?.ViolationCode || "----",
    },
    {
      title: "",
      skip: true
    },
    {
      title: "تصنيف المخالفة",
      render: (record) =>
        functions.getViolationArabicName(record.Violation?.OffenderType),
    },
    {
      title: "نوع المخالفة",
      render: (record) =>
        functions.getViolationArabicName(
          record.Violation?.OffenderType,
          record.Violation?.ViolationTypes?.Title
        ),
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) =>
        record.Created
          ? moment(record.Created).format("DD-MM-YYYY hh:mm A")
          : "-",

    },
    {
      title: "تاريخ المحضر",
      render: (record) => {
        if (!record.Violation?.ViolationDate) return "-";

        return moment(record.Violation.ViolationDate).format(
          "DD-MM-YYYY hh:mm A"
        );
      },
    },
    {
      title: "اسم المخالف",
      render: (record) =>
        record.Violation?.ViolatorName ||
        "-",
    },
    {
      title: "إسم الشركة",
      render: (record) => record.Violation?.ViolatorCompany || "-",
    },
    {
      title: "رقم المحجر / العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "---") : (violation.QuarryCode || "---");
      },
    },
    {
      title: "رقم المقطورة",
      render: (record) =>
        record.Violation?.TrailerNum || "-",
    },
    {
      title: "المنطقة",
      render: (record) =>
        record.Violation?.ViolationsZone || "----",
    },
    {
      title: "مبلغ المادة المحجرية",
      render: (record) => {
        const value = record.Violation?.TotalPriceDue;

        return value && value > 0 ? value : "-";
      },
    },
    {
      title: "قيمة الإتاوة",
      render: (record) => {
        const value = record.Violation?.LawRoyalty;

        return value && value > 0 ? value : "-";
      },
    },
    {
      title: "قيمة المعدة",
      render: (record) => {
        const value = record.Violation?.TotalEquipmentsPrice;

        return value && value > 0 ? value : "-";
      },
    },
    {
      title: "الكمية",
      render: (record) => {
        const value = record.Violation?.TotalQuantity;
        return value && value > 0 ? value : "-";
      },
    },
    {
      title: "حالة المخالفة",
      render: (record) => {
        const status = record.Status;

        const statusMap = {
          Pending: "قيد الانتظار",
          Confirmed: "قيد الانتظار",
          Exceeded: "تجاوز مدة السداد",
          Saved: "محفوظة",
          "Paid After Reffered": "سداد بعد الإحالة",
          Paid: "تم السداد",
          UnderPayment: "قيد السداد",
          Approved: "تم الموافقة",
          Rejected: "مرفوضة",
          Reffered: "تم الإحالة",
          UnderReview: "منظورة",
          ExternalReviewed: "منظورة",
          Completed: "مكتملة",
          Cancelled: "ملغاه",
        };

        return statusMap[status] || status || "-";
      },
    },
    {
      title: "حالة الالتماس",
      render: (record) => {
        const violation = record.Violation;

        if (!violation?.IsPetition) return "-";

        return (
          functions.getPetitionsStatus(
            violation?.Petition?.GridData?.[0]?.Status
          ) || "-"
        );
      },
    },
    {
      title: "موقف الإحالة",
      render: (record) =>
        record?.ReferralStatus || "----",
    },
    {
      title: "الإحداثيات",
      exportOnly: true,
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";

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

        return "---";
      },
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: allColumns,
    fileName: "المخالفات المصدق عليها.xlsx",
    sheetName: "المخالفات المصدق عليها",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#ValidatedViolation"
  });
};
validatedViolations.ValidatedViolationTable = (ValidatedViolation, destroyTable) => {
  let data = [];
  let taskViolation;
  let TaskStatus;
  let violationDate;
  let taskId;
  let violationId;
  let paymentStatus;
  let CurrentDate = functions.getCurrentDateTime("Date");

  if (ValidatedViolation.length > 0) {
    ValidatedViolation.forEach((record) => {
      taskViolation = record.Violation;
      taskId = record.ID;
      violationId = record.ViolationId;
      TaskStatus = record.Status;
      paymentStatus = record.PaymentStatus;
      let date = functions.getFormatedDate(record.ReconciliationExpiredDate);
      let DateYear = date.split("-")[2];
      let ExpiredDate;
      violationDate = functions.getFormatedDate(record.ReconciliationExpiredDate);
      let createdDate = functions.getFormatedDate(record.Created);
      let caseStatus = record?.ReferralStatus || "";
      let IsDublicated = record.IsDublicated;

      if (
        moment(new Date()).format("MM-DD-YYYY") >
        moment(record.ReconciliationExpiredDate).format("MM-DD-YYYY") &&
        DateYear > 2020 &&
        TaskStatus == "Confirmed"
      ) {
        validatedViolations.violationExceedTimeStatusChange(taskId, violationId);
      }

      if (DateYear > 2020) {
        ExpiredDate = functions.getFormatedDate(record.ReconciliationExpiredDate);
      } else {
        ExpiredDate = "-";
      }

      data.push([
        `<div class="violationId"
            data-taskid="${record.ID}"
            data-violationid="${record.ViolationId}"
            data-taskstatus="${record.Status}"
            data-paymentstatus="${record.PaymentStatus}"
            data-violationcode="${taskViolation?.ViolationCode}"
            data-totalprice="${taskViolation?.TotalPriceDue}"
            data-enddate="${record.ReconciliationExpiredDate}"
            data-offendertype="${taskViolation?.OffenderType}"
            data-isdublicated="${IsDublicated}"
            data-equipments_count="${taskViolation?.Equipments_Count}"
            >
            ${taskViolation?.ViolationCode || "-"}
        </div>`,

        `<div class='controls'>
          <div class='ellipsisButton'>
              <i class='fa-solid fa-ellipsis-vertical'></i>
          </div>
          <div class="hiddenListBox">
              <div class='arrow'></div>
              <ul class='list-unstyled controlsList'>
                  <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
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
                  <li><a href="#" class="printPaymentForm">طباعة نموذج التصديق</a></li>  
                  <li><a href="#" class="printPaymentFormOnly">طباعة نموذج السداد</a></li>
              </ul>
          </div>
        </div>`,

        `<div class="violationArName">
          ${functions.getViolationArabicName(taskViolation?.OffenderType)}
        </div>`,

        `<div class="violationType"
            data-typeid="${taskViolation?.OffenderType == "Quarry"
          ? taskViolation?.ViolationTypes.ID
          : 0}">
            ${functions.getViolationArabicName(
            taskViolation?.OffenderType,
            taskViolation?.ViolationTypes?.Title
          )}
        </div>`,

        record.Created
          ? moment(record.Created).format("DD-MM-YYYY hh:mm A")
          : "-",

        taskViolation?.ViolationDate
          ? moment(taskViolation?.ViolationDate).format("DD-MM-YYYY hh:mm A")
          : "-",

        `<div class="ViolatorName">
        ${taskViolation?.ViolatorName || "-"}
        </div>`,

        `<div class="ViolatorCompany">
        ${taskViolation?.ViolatorCompany || "-"}
        </div>`,

        `<div class="violationCode">
          ${taskViolation?.OffenderType == "Vehicle"
          ? taskViolation?.CarNumber
          : taskViolation?.QuarryCode != undefined
            ? taskViolation?.QuarryCode
            : "-"}
        </div>`,

        `<div class="trailerNum">
          ${taskViolation?.TrailerNum || "-"}
        </div>`,

        `<div class="violationZone">
          ${taskViolation?.ViolationsZone || "-"}
        </div>`,

        `${taskViolation?.TotalPriceDue > 0
          ? taskViolation?.TotalPriceDue
          : "-"}`,

        `${taskViolation?.LawRoyalty > 0
          ? taskViolation?.LawRoyalty
          : "-"}`,

        `${taskViolation?.TotalEquipmentsPrice > 0
          ? taskViolation?.TotalEquipmentsPrice
          : "-"}`,

        `${taskViolation?.TotalQuantity > 0
          ? taskViolation?.TotalQuantity
          : "-"}`,

        `${validatedViolations.getViolationStatus(record.Status)}`,

        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status
          ) || "-"
          : "-"
        }`,

        `<div class="referralStatus">
            ${functions.getCaseStatus(caseStatus)}
        </div>`,
      ]);
    });
  }

  if (validatedViolations.destroyTable || destroyTable) {
    $("#ValidatedViolation").DataTable().destroy();
  }

  let Table = functions.tableDeclare(
    "#ValidatedViolation",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "نوع المخالفة" },
      { title: "تاريخ الإنشاء" },
      { title: "تاريخ المحضر" },
      { title: "اسم المخالف" },
      { title: "اسم الشركة" },
      { title: "رقم المحجر / العربة" },
      { title: "رقم المقطورة" },
      { title: "المنطقة" },
      { title: "مبلغ المادة المحجرية" },
      { title: "قيمة الإتاوة" },
      { title: "قيمة المعدة" },
      { title: "الكمية" },
      { title: "حالة المخالفة" },
      { title: "حالة الالتماس" },
      { title: "موقف الإحالة" },
    ],
    false,
    false,
    "المخالفات المصدق عليها.xlsx",
    "المخالفات المصدق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  validatedViolations.destroyTable = true;

  $("#ValidatedViolations #exportBtn").off("click").on("click", () => {
    validatedViolations.exportToExcel();
  });

  // $(".ellipsisButton").on("click", (e) => {
  //   $(".hiddenListBox").hide(300);
  //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  // });

  let UserId = _spPageContextInfo.userId;
  let violationlog = Table.rows().nodes().to$();
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        UserDetails = User;
      }
    });

    $(".detailsPopupForm").addClass("validatedViolations");

    $.each(violationlog, (index, record) => {
      let jQueryRecord = $(record);
      let offenderType = jQueryRecord.find(".violationId").data("offendertype");
      let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
      let violationID = jQueryRecord.find(".violationId").data("violationid");
      let violationCode = jQueryRecord.find(".violationId").data("violationcode");
      let taskStatus = jQueryRecord.find(".violationId").data("taskstatus");
      let paymentStatus = jQueryRecord.find(".violationId").data("paymentstatus");
      let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");
      let TotalPrice = jQueryRecord.find(".violationId").data("totalprice");
      let EndDate = jQueryRecord.find(".violationId").data("enddate");
      let IsDublicated = jQueryRecord.find(".violationId").data("isdublicated");
      let Equipments_Count = jQueryRecord.find(".violationId").data("equipments_count");

      // Create separate buttons based on offender type
      let referralButtonHtml = '';
      if (offenderType === "Quarry") {
        referralButtonHtml = `<li><a href="#" class="reffereViolationQuarry">إحالة إلى النيابة المختصة</a></li>`;
      } else if (offenderType === "Vehicle") {
        referralButtonHtml = `<li><a href="#" class="reffereViolationVehicle">حظر عربة</a></li>`;
      } else if (offenderType === "Equipment") {
        referralButtonHtml = `<li><a href="#" class="reffereViolationEquipment">حظر معدة</a></li>`;
      }

      switch (taskStatus) {
        case "Confirmed": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
            ${referralButtonHtml}
          `);
          break;
        }
        case "UnderPayment": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            ${referralButtonHtml}
          `);
          break;
        }
        case "Exceeded": {
          jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            ${referralButtonHtml}
            <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
            <li><a href="#" class="requestPetition">تقديم بيان التماس</a></li>
          `);
          break;
        }
      }

      // if (
      //   violationlog.length > 4 && hiddenListBox.height() > 110 &&
      //   jQueryRecord.is(":nth-last-child(-n + 4)")) {
      //   hiddenListBox.addClass("toTopDDL");
      // }

      // Toggle menu
      jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
        e.stopPropagation();
        const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
        $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
        currentBox.stop(true, true).toggle(300);
      });

      // Common event handlers
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "Details");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentForm").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "PaymentFormPrint");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".payViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.findViolationByID(e, violationTaskID, "PaymentForm");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".requestPetition").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.requestNewPetition(violationTaskID, violationID, violationCode);
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".killViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        confirmPopup.updateTaskStatusPopup(violationTaskID, violationCode, violationID, "Kill");
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".editViolation").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.editViolationDataPopup(violationTaskID, violationID, violationCode, TotalPrice, EndDate);
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").on("click", (e) => {
        validatedViolations.findViolationByID(e, violationTaskID, "Details", true);
      });

      // Separate event handlers for quarry and vehicle referral
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".reffereViolationQuarry").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationToCase(
          violationTaskID,
          violationID,
          violationCode,
          offenderType,
          TotalPrice
        );
      });

      jQueryRecord.find(".controls").children(".hiddenListBox").find(".reffereViolationVehicle").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationToCase(
          violationTaskID,
          violationID,
          violationCode,
          offenderType,
          TotalPrice,
          IsDublicated
        );
      });
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".reffereViolationEquipment").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationToCase(
          violationTaskID,
          violationID,
          violationCode,
          offenderType,
          TotalPrice,
          IsDublicated,
          Equipments_Count
        );
      });
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentForm").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.printPaymentForm(e, violationTaskID);
      });

      // Print payment form only
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentFormOnly").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolations.printPaymentFormOnly(e, violationTaskID);
      });

    });
  });

  functions.hideTargetElement(".controls", ".hiddenListBox");
};
validatedViolations.getViolationStatus = (ViolationStatus) => {
  let statusHtml = ``;
  switch (ViolationStatus) {
    case "Pending":
    case "Confirmed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-clock"></i>
                <span class="statusText">قيد الانتظار</span>
            </div>`;
      break;
    }
    case "Exceeded": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">تجاوز مدة السداد</span>
            </div>`;
      break;
    }
    case "Saved": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">محفوظة</span>
            </div>`;
      break;
    }
    case "Paid After Reffered": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">سداد بعد الإحالة</span>
            </div>`;
      break;
    }
    case "Paid": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم السداد</span>
            </div>`;
      break;
    }
    case "UnderPayment": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">قيد السداد</span>
            </div>`;
      break;
    }
    case "Approved": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم الموافقة</span>
            </div>`;
      break;
    }
    case "Rejected": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">مرفوضة</span>
            </div>`;
      break;
    }
    case "Reffered": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-paper-plane"></i>
                <span class="statusText">تم الإحالة</span>
            </div>`;
      break;
    }
    case "UnderReview": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
      break;
    }
    case "ExternalReviewed": {
      statusHtml = `<div class="statusBox pendingStatus">
                 <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
      break;
    }
    case "Completed": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">مكتملة</span>
            </div>`;
      break;
    }
    case "Cancelled": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">ملغاه</span>
            </div>`;
      break;
    }
  }

  return statusHtml;
};
validatedViolations.findViolationByID = (
  event,
  violationTaskID,
  popupType = "",
  print = false,
) => {
  let request = {
    Id: violationTaskID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData,
        violationOffenderType,
        Content,
        TaskId,
        paymentForm,
        TaskData,
        printBox,
        ExDate,
        PrintedCount;
      if (data != null) {
        TaskData = data.d;

        violationData = TaskData.Violation;

        TaskId = TaskData.ID;

        ExDate = functions.getFormatedDate(TaskData.ReconciliationExpiredDate);
        violationOffenderType = violationData.OffenderType;
        PrintedCount = TaskData.PrintedCount;
        if (violationOffenderType == "Quarry") {
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.quarryDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.quarryDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
        } else if (violationOffenderType == "Vehicle") {
          let VehcleType = violationData.VehicleType;
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.vehicleDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.vehicleDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          if (popupType == "PaymentForm") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.equipmentDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            paymentForm = validatedViolations.paymentFormHtml(TaskData);
            Content += paymentForm;
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          } else if (popupType == "PaymentFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData);
            functions.declarePopup(
              ["generalPopupStyle", "paymentFormDetailsPopup"],
              Content,
            );
          } else {
            Content = DetailsPopup.equipmentDetailsPopupContent(
              violationData,
              "المصدق عليها",
            );
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
              ["generalPopupStyle", "detailsPopup"],
              printBox,
            );
          }
        }

        // FIX: Hide buttons AFTER rendering - Add this block
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);


        validatedViolations.popupPermissionShowTypes(popupType, TaskId, ExDate);
        validatedViolations.paymentFormActions();
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }
        $(".printConfirmationForm").hide();
        $(".printPaymentForm").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".printPaymentFormBtn").on("click", (e) => {
          validatedViolations.setExpirationDate(
            TaskId,
            PrintedCount,
            violationOffenderType,
          );
          functions.PrintDetails(e);
        });
        $(".detailsPopupForm").addClass("validatedViolations");
      } else {
        violationData = null;
      }
    })
    .catch((err) => { });
};
validatedViolations.printPaymentForm = (event, taskID, print = false) => {
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
      let TaskData;
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;

      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;
        violationOffenderType = violationData.OffenderType;

        if (violationOffenderType == "Quarry") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        } else if (violationOffenderType == "Vehicle") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        } else if (violationOffenderType == "Equipment") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        }

        // Remove previous handlers before adding new ones
        $(".printBtn").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        });

        // FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        // $(".printPaymentForm").hide();
        $(".printConfirmationForm").css("display", "flex !important");

        // Remove previous handler before adding new one
        $(".printConfirmationForm").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        });

      }
    })
    .catch((err) => {
      console.log(err);
    });
};
validatedViolations.printPaymentFormOnly = (event, taskID) => {
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
      let TaskData;
      let Content;

      if (data != null) {
        TaskData = data.d;

        $(".overlay").removeClass("active");
        Content = DetailsPopup.printConfirmationFormOnly(TaskData);
        functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);

        // Add print and close button handlers
        setTimeout(() => {
          // Remove previous handlers before adding new ones
          $(".printPaymentFormBtn").off("click").on("click", (e) => {
            const lowerSection = $(".violationDetailsBody").closest(".popupSectionWrapper");
            if (lowerSection.length) {
              lowerSection.hide();
            }
            functions.PrintDetails(e);
            setTimeout(() => {
              if (lowerSection.length) {
                lowerSection.show();
              }
            }, 1000);
          });

          $(".closePrintPaymentDetailsPopup").off("click").on("click", () => {
            functions.closePopup();
          });
        }, 100);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

//////////////////////////////////////////////////

validatedViolations.setExpirationDate = (
  TaskId,
  PrintedCount,
  violationOffenderType,
) => {
  // $(".modal:last-child").attr("aria-label","Close")
  // $(".modal:last-child").attr("data-dismiss","modal")
  let request = {};
  let ExpirationDate;

  if (PrintedCount == 0) {
    if (violationOffenderType == "Quarry") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(30);
    } else if (violationOffenderType == "Vehicle") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(15);
    } else if (violationOffenderType == "Equipment") {
      ExpirationDate = functions.getNDaysAfterCurrentDate(30);
    }
    request = {
      Data: {
        ID: TaskId,
        PrintedCount: 1,
        ReconciliationExpiredDate: ExpirationDate,
      },
    };
  } else {
    PrintedCount += 1;
    request = {
      Data: {
        ID: TaskId,
        PrintedCount: PrintedCount,
      },
    };
  }

  validatedViolations.setExpirationDateAPI(request);
};
validatedViolations.setExpirationDateAPI = (request) => {
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => { })
    .catch((err) => { });
};

validatedViolations.popupPermissionShowTypes = (popupType, TaskId, ExDate) => {
  if (popupType == "Details") {
    $(".totalPriceBox")
      .show()
      .find(".violationEndTime")
      .val(ExDate == "01-01-2001" ? "-" : ExDate);
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
  }
  // else if(popupType == "PaymentFormPrint"){
  //     $(".totalPriceBox").show().find(".violationEndTime").val(ExDate)
  //     $(".printPaymentForm").css("display","flex")
  // }
  else if (popupType == "PaymentForm") {
    $(".hiddenDetailsBox").addClass("showHiddenDetailsBox");
    $(".totalPriceBox")
      .show()
      .find(".violationEndTime")
      .val(ExDate == "01-01-2001" ? "-" : ExDate);
    $(".popupFormBoxHeader").show();
    $(".confirmationAttachBox").show();
    DetailsPopup.getConfirmationAttachments(TaskId);
    $(".detailsPopupForm").find(".formButtonsBox").hide();
    $(".hiddenDetailsBox").hide();
    $(".showMoreDetails").css("display", "flex");
    $(".showMoreDetails").on("click", (e) => {
      $(".hiddenDetailsBox").slideToggle();
      $(".showMoreDetails").find("img").toggleClass("rotateDetailsIcon");
      $(".showMoreDetails")
        .find("p")
        .text(
          $(".showMoreDetails").find("p").text() == "إظهار المزيد من التفاصيل"
            ? "إخفاء التفاصيل"
            : "إظهار المزيد من التفاصيل",
        );
    });
  }
};


////////////////////////////////////////
validatedViolations.paymentFormHtml = (TaskData) => {
  let offenderType = TaskData.Violation.OffenderType;
  let violationPriceType =
    TaskData.Violation.ViolationTypes != null
      ? TaskData.Violation.ViolationTypes.PriceType
      : "";
  let TotalViolationPrice = TaskData.Violation.TotalPriceDue;
  let RoyaltyPrice = TaskData.Violation.LawRoyalty;
  let QuarryMaterialValue = TaskData.Violation.QuarryMaterialValue;
  // let FinesValue = TaskData.Violation.TotalPriceDue;
  let violationTypeLastPrice;
  let labelText;
  let inputVal;
  if (offenderType == "Quarry") {
    violationTypeLastPrice = DetailsPopup.getQuarryViolationValueByType(
      violationPriceType,
      TotalViolationPrice,
      QuarryMaterialValue,
    );
    labelText = violationTypeLastPrice.labelText;
    inputVal = violationTypeLastPrice.InputVal;
  } else {
    violationTypeLastPrice = DetailsPopup.getVechileViolationValueByType(
      TotalViolationPrice,
      RoyaltyPrice,
    );
    labelText = violationTypeLastPrice.labelText;
    inputVal = violationTypeLastPrice.InputVal;
  }


  let quarryPriceInDetails = `
        <div class="col-md-4 violationPriceBox">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(
    inputVal,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-4 royaltyPriceBox">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.LawRoyalty,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-4 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.TotalEquipmentsPrice,
  )}" disabled>
            </div>
        </div>
    `;


  let vehiclePriceInDetails = `
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(
    inputVal,
  )}" disabled>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.LawRoyalty,
  )}" disabled>
            </div>
    </div>
    `;


  let equipmentsPriceInDetails = `
    <div class="col-md-12 equipmentsPriceBox">
        <div class="form-group customFormGroup">
            <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
            <input
                class="form-control customInput equipmentsPrice disabledInput"
                id="equipmentsPrice"
                type="text"
                value="${functions.splitBigNumbersByComma(
    TaskData?.Violation?.TotalEquipmentsPrice
  )}"
                disabled
            >
        </div>
    </div>
`;

  let paymentFormHtml = `
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" 
                    data-taskid="${TaskData.ID}" 
                    data-violationid="${TaskData.ViolationId}" 
                    data-actualprice="${TaskData.Violation.ActualAmountPaid}" 
                    data-lawroyalty="${TaskData.Violation.LawRoyalty}" 
                    data-totalequipmentsprice="${TaskData.Violation.TotalEquipmentsPrice}" 
                    data-totalprice="${TaskData.Violation.TotalPriceDue}" 
                    data-offendertype="${TaskData.Violation.OffenderType}" 
                    data-violationpricetype="${offenderType == "Quarry" ? TaskData.Violation.ViolationTypes.PriceType : 0}" 
                    data-totalinstallmentspaidamount="${TaskData?.Violation?.TotalInstallmentsPaidAmount || 0}">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                ${offenderType == "Quarry"
      ? quarryPriceInDetails
      : offenderType == "Vehicle"
        ? vehiclePriceInDetails
        : offenderType == "Equipment"
          ? equipmentsPriceInDetails
          : ""
    }
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">المبلغ المطلوب تسديده كامل</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" 
                                              value="${functions.splitBigNumbersByComma(
      TaskData?.Violation?.TotalPriceDue,
    )}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" 
                                                    value="${functions.getFormatedDate(
      TaskData?.ReconciliationExpiredDate,
    ) == "01-01-2001"
      ? "-"
      : functions.getFormatedDate(
        TaskData?.ReconciliationExpiredDate,
      )
    }" disabled>
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>


                                    <!----------------------------- المبلغ المتبقي -->
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                      <label class="customLabel">المبلغ المتبقي</label>
                                      <input
                                        class="form-control customInput disabledInput remainingAmount"
                                        type="text"
                                        value="${functions.splitBigNumbersByComma(
      TaskData?.Violation?.RemainingAmount
    )}"
                                        disabled
                                      />
                                    </div>

                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>

                                    <!---------------------  سداد بالتقسيط-->
                                    <div class="form-group customFormGroup installmentBox">
                                      <label class="checkboxLabel">
                                        <input
                                          type="checkbox"
                                          class="installmentCheckbox"
                                          ${TaskData?.Violation?.IsInstallment ? "checked disabled" : ""}
                                        />
                                        سداد بالتقسيط
                                      </label>
                                    </div>

                                </div>

                                <div class="col-md-6">
                                  ${offenderType != "Equipment"
      ? `
                                    <div class="form-group customFormGroup payQuarryAttachBox">
                                        <label for="attachQuarryPaymentReceipt" class="customLabel">إرفاق إيصال غرامة القيمة المحجرية * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachQuarryPaymentReceipt form-control" id="attachQuarryPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    <div class="form-group customFormGroup payRoyaltyAttachBox">
                                        <label for="attachLawRoyaltyPaymentReceipt" class="customLabel">إرفاق إيصال الإتاوة * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachLawRoyaltyPaymentReceipt form-control" id="attachLawRoyaltyPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    `
      : ""
    }
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" 
                                          style="display:${offenderType == "Quarry" ||
      offenderType == "Equipment"
      ? "block !important"
      : "none !important"
    }">
                                        <label for="attachEquipmentsPaymentReceipt" class="customLabel">إرفاق إيصال غرامة المعدات * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachEquipmentsPaymentReceipt form-control" id="attachEquipmentsPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payInstallment" style="display:none">
                                  سداد بالتقسيط
                                </div>

                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice">
                                  تسديد وإنهاء المخالفة
                                </div>                                
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    `;
  return paymentFormHtml;
};
validatedViolations.paymentFormActions = () => {
  let request = {};
  let violtionPriceType = $(".paymentForm").data("violationpricetype");
  let offenderType = $(".paymentForm").data("offendertype");
  let lawRoyalty = Number($(".paymentForm").data("lawroyalty") || 0);
  let totalEquipmentsPrice = Number($(".paymentForm").data("totalequipmentsprice") || 0);
  let taskId = $(".paymentForm").data("taskid");
  let violationId = $(".paymentForm").data("violationid");
  let TotalPrice = Number($(".paymentForm").data("totalprice"));
  let remainingAmount = Number(
    $(".remainingAmount").val()?.replace(/,/g, "") || 0
  );
  let totalInstallmentsPaidAmount = Number(
    $(".paymentForm").data("totalinstallmentspaidamount") || 0
  );
  let paymentDurationMonths = 2;
  let payedPrice = 0;
  let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

  let filesExtension = [
    "gif",
    "svg",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "pdf",
    "xls",
    "xlsx",
    "pptx",
  ];

  $(".dropFilesArea").hide();

  // =========================================
  // FILE STORAGE
  // =========================================

  let paymentQuarryReceipt = null;
  let paymentRoyaltyReceipt = null;
  let paymentEquipmentsReceipt = null;

  // =========================================
  // HELPERS
  // =========================================

  function hasRoyaltyReceipt() {
    return (
      paymentRoyaltyReceipt &&
      paymentRoyaltyReceipt.length > 0
    );
  }

  function hasQuarryReceipt() {
    return (
      paymentQuarryReceipt &&
      paymentQuarryReceipt.length > 0
    );
  }

  function hasEquipmentsReceipt() {
    return (
      paymentEquipmentsReceipt &&
      paymentEquipmentsReceipt.length > 0
    );
  }

  // =========================================
  // VALIDATIONS
  // =========================================

  function validateRoyaltyReceiptRequired() {
    let isVisible = $(".payRoyaltyAttachBox").is(":visible");
    if (
      isVisible &&
      // lawRoyalty > 0 &&
      !hasRoyaltyReceipt()
    ) {
      functions.warningAlert(
        "من فضلك قم بإرفاق إيصال الإتاوة"
      );
      return false;
    }
    return true;
  }

  function validateEquipmentReceiptRequired() {
    // Check if equipment attachment is required based on offender type and price
    let isEquipmentVisible = $(".payEquipmentsAttachBox").is(":visible");

    if (isEquipmentVisible && !hasEquipmentsReceipt()) {
      functions.warningAlert(
        "من فضلك قم بإرفاق إيصال غرامة المعدات"
      );
      return false;
    }

    return true;
  }

  function validateQuarryReceiptRequired() {
    if (!hasQuarryReceipt()) {
      functions.warningAlert(
        "من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية"
      );
      return false;
    }
    return true;
  }

  function validateAllAttachments() {
    if (offenderType === "Equipment") {
      // For equipment, only validate equipment receipt
      if (!validateEquipmentReceiptRequired()) {
        return false;
      }
      return true;
    }

    // For Quarry and Vehicle types
    if (!validateQuarryReceiptRequired()) {
      return false;
    }
    if (!validateRoyaltyReceiptRequired()) {
      return false;
    }
    if (!validateEquipmentReceiptRequired()) {
      return false;
    }
    return true;
  }

  // =========================================
  // UI TOGGLE
  // =========================================

  if ($(".installmentCheckbox").is(":checked")) {
    $(".payAllPrice").hide();
    $(".payInstallment").show();
  } else {
    $(".payAllPrice").show();
    $(".payInstallment").hide();
  }

  $(".installmentCheckbox").on("change", function () {
    if ($(this).is(":checked")) {
      $(".payAllPrice").hide();
      $(".payInstallment").show();
    } else {
      $(".payInstallment").hide();
      $(".payAllPrice").show();
    }
  });

  // =========================================
  // UI RULES
  // =========================================
  if (offenderType === "Equipment") {
    // For equipment, show only equipment-related fields
    $(".payQuarryAttachBox").hide();
    $(".payRoyaltyAttachBox").hide();
    $(".violationPriceBox").hide();
    $(".royaltyPriceBox").hide();

    // Show equipment attachment if there are equipment prices
    if (totalEquipmentsPrice > 0) {
      $(".payEquipmentsAttachBox").show();
    } else {
      $(".payEquipmentsAttachBox").hide();
    }
  } else if (violtionPriceType == "fixed" || violtionPriceType == "store") {
    $(".payEquipmentsAttachBox").hide();
    $(".payRoyaltyAttachBox").hide();

    $(".equipmentsPriceBox").hide();
    $(".royaltyPriceBox").hide();

    $(".violationPriceBox")
      .removeClass("col-md-4")
      .addClass("col-md-7");
  }
  // =========================================
  // FILE UPLOAD HANDLER
  // =========================================

  function handleFileUpload(selector, setFiles) {
    $(selector).on("change", (e) => {
      let files = e.currentTarget.files;
      const dropArea = $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea");
      dropArea.empty();

      // ============================
      // EXTENSION VALIDATION
      // ============================

      for (let i = 0; i < files.length; i++) {
        let ext = files[i].name
          .split(".")
          .pop()
          .toLowerCase();

        if ($.inArray(ext, filesExtension) === -1) {
          functions.warningAlert(
            "من فضلك أدخل الملفات بالمرفقات المسموح بها فقط"
          );
          $(e.currentTarget).val("");
          dropArea.hide();
          setFiles(null);
          return;
        }
      }

      // ============================
      // SAVE FILES
      // ============================

      setFiles(files);

      // ============================
      // SHOW FILES
      // ============================

      if (files.length > 0) {
        dropArea.show();
      }

      for (let i = 0; i < files.length; i++) {
        dropArea.append(`
          <div class="file">
            <p class="fileName">${files[i].name}</p>
            <span class="deleteFile" data-index="${i}">
              <i class="fa-sharp fa-solid fa-x"></i>
            </span>
          </div>
        `);
      }

      // ============================
      // DELETE FILE
      // ============================

      dropArea.find(".deleteFile").on("click", (event) => {
        let index = $(event.currentTarget)
          .closest(".file")
          .index();
        $(event.currentTarget)
          .closest(".file")
          .remove();
        let fileBuffer = new DataTransfer();
        for (let i = 0; i < files.length; i++) {
          if (index !== i) {
            fileBuffer.items.add(files[i]);
          }
        }
        files = fileBuffer.files;
        setFiles(files);
        if (files.length === 0) {
          dropArea.hide();
        }
      });
    });
  }

  // =========================================
  // REGISTER FILE HANDLERS
  // =========================================

  handleFileUpload(
    "#attachQuarryPaymentReceipt",
    (files) => {
      paymentQuarryReceipt = files;
    }
  );

  handleFileUpload(
    "#attachLawRoyaltyPaymentReceipt",
    (files) => {
      paymentRoyaltyReceipt = files;
    }
  );

  handleFileUpload(
    "#attachEquipmentsPaymentReceipt",
    (files) => {
      paymentEquipmentsReceipt = files;
    }
  );

  // =========================================
  // INPUT FORMAT
  // =========================================

  $(".payedPrice").on("keyup", (e) => {
    let val = $(e.currentTarget)
      .val()
      .replace(/,/g, "");
    $(e.currentTarget).val(
      val.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
    );
    payedPrice = Number(val);
  });

  $(".payedPrice").on("keypress", (e) => {
    return functions.isDecimalNumberKey(e);
  });

  // =========================================
  // FULL PAYMENT
  // =========================================

  $(".payAllPrice").on("click", () => {
    if (
      payedPrice === "" ||
      !PositiveDecimalNumbers.test(payedPrice)
    ) {
      functions.warningAlert(
        "من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح"
      );
      return;
    }

    if (Number(payedPrice) !== TotalPrice) {
      functions.warningAlert(
        "المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للمخالفة"
      );
      return;
    }

    if (!validateAllAttachments()) {
      return;
    }

    request = {
      Data: {
        ID: taskId,
        ViolationId: violationId,
        ActualAmountPaid: Number(payedPrice),
        Status: "Paid",
      },
    };

    $(".overlay").addClass("active");

    validatedViolations.payRequest(
      taskId,
      request,
      "FullPay",
      offenderType
    );
  });

  // =========================================
  // INSTALLMENT PAYMENT
  // =========================================

  $(".payInstallment").on("click", () => {
    if (!payedPrice || payedPrice <= 0) {
      functions.warningAlert(
        "من فضلك أدخل مبلغ صحيح"
      );
      return;
    }
    if (payedPrice > remainingAmount) {
      functions.warningAlert(
        "المبلغ المدخل أكبر من المبلغ المتبقي"
      );
      return;
    }

    if (!validateAllAttachments()) {
      return;
    }

    let newRemainingAmount = remainingAmount - payedPrice;
    let isLastInstallment = newRemainingAmount === 0;

    request = {
      Data: {
        ID: taskId,
        ViolationId: violationId,
        ActualAmountPaid: payedPrice,
        Status: isLastInstallment ? "Paid" : "UnderPayment",

        Violation: {
          IsInstallment: true,
          InstallmentAmount: payedPrice,
          RemainingAmount: newRemainingAmount,
          PaymentDurationMonths: paymentDurationMonths,
          TotalInstallmentsPaidAmount: totalInstallmentsPaidAmount + payedPrice,

          ...(isLastInstallment && {
            IsLastInstallment: true,
          }),
        },
      },
    };

    $(".overlay").addClass("active");

    validatedViolations.payRequest(
      taskId,
      request,
      "InstallmentPay",
      offenderType
    );
  });
};
validatedViolations.payRequest = (
  TaskId,
  request,
  PaymentType,
  offenderType,
) => {
  // Store the request data in the form element
  $(".paymentForm").data("lastRequest", request);

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
      validatedViolations.uploadPaymentReceiptsAttachment(
        TaskId,
        "ViolationsCycle",
        offenderType,
      );
    })
    .catch((err) => { });
};
//////////////////////////////////////////////////////
validatedViolations.reffereViolationToCase = (
  TaskId,
  ViolationId,
  ViolationCode,
  OffenderType,
  TotalPrice,
  IsDublicated,
  Equipments_Count
) => {
  $(".overlay").removeClass("active");

  // Determine the ReferralStatus based on offender type
  let referralStatus = '';
  if (OffenderType === "Quarry") {
    referralStatus = "قيد انتظار رقم الإحالة";
  } else if (OffenderType === "Vehicle") {
    referralStatus = "قيد انتظار رقم القيد";
  } else if (OffenderType === "Equipment") {
    referralStatus = "قيد انتظار رقم القيد";
  }

  // Store the referral status for later use in API calls
  $("body").data("currentReferralStatus", referralStatus);

  // Determine popup title and input label based on offender type
  let popupTitle = '';
  let inputLabel = '';
  let inputPlaceholder = '';

  if (OffenderType === "Quarry") {
    popupTitle = `إحالة المحجر رقم (${ViolationCode}) إلى النيابة المختصة`;
    inputLabel = 'رقم الإحالة';
    inputPlaceholder = 'ادخل رقم الإحالة';
  } else if (OffenderType === "Vehicle") {
    popupTitle = `حظر العربة رقم (${ViolationCode})`;
    inputLabel = 'رقم القيد';
    inputPlaceholder = 'ادخل رقم القيد';
  } else if (OffenderType === "Equipment") {
    popupTitle = `حظر المعدة رقم (${ViolationCode})`;
    inputLabel = 'رقم القيد';
    inputPlaceholder = 'ادخل رقم القيد';
  } else {
    popupTitle = `إحالة المخالفة رقم (${ViolationCode})`;
    inputLabel = 'رقم الإحالة';
    inputPlaceholder = 'ادخل رقم الإحالة';
  }

  // Generate unique IDs for close buttons
  const closeHeaderId = "closeReffereHeader_" + Math.random().toString(36).substr(2, 9);
  const closeFooterId = "closeReffereFooter_" + Math.random().toString(36).substr(2, 9);

  let popupHtml = `
    <div class="popupHeader" style="display: flex; justify-content: space-between;">
      <div class="violationsCode"> 
        <p>${popupTitle}</p>
      </div>
      <div class="btnStyle cancelBtn popupBtn ${closeHeaderId}" id="${closeHeaderId}" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
        <i class="fa-solid fa-x"></i>
      </div>
    </div> 
    <div class="popupBody scrollable-popup-body" style="max-height: 80vh; overflow-y: auto; padding: 15px;">
      <div class="popupForm detailsPopupForm" id="detailsPopupForm">
        <div class="formContent"> 
          <div class="formBox">
            <div class="formElements">
              <div class="row">
              <!--
                <div class="col-md-6">
                  <div class="form-group customFormGroup">
                    <label for="reffereViolationNumber" class="customLabel">${inputLabel}</label>
                    <div class="selectBox smallSelectBox">
                      <input id="reffereViolationNumber" type="text" class="form-control customInput reffereViolationNumber" placeholder="${inputPlaceholder}" />
                    </div>
                  </div>
                </div>
                -->
                <div class="col-md-6">
                  <div class="form-group customFormGroup">
                    <label for="reffereViolationDate" class="customLabel">تاريخ الإحالة * </label>
                    <div class="inputIconBox">
                      <input class="form-control customInput inputDate reffereViolationDate" id="reffereViolationDate" type="text" placeholder="MM/DD/YYYY">
                      <i class="fa-solid fa-calendar-days"></i>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="form-group customFormGroup">
                    <label for="reffereViolationComments" class="customLabel">الملاحظات</label>
                    <textarea class="form-control customTextArea reffereViolationComments" id="reffereViolationComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                  </div>
                </div>
                <div class="col-12">
                  <div class="form-group customFormGroup">
                    <label for="reffereViolationAttach" class="customLabel">إرفاق مستند * </label>
                    <div class="fileBox" id="dropContainer">
                      <div class="inputFileBox">
                        <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                        <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                        <input type="file" class="customInput attachFilesInput reffereViolationAttach form-control" id="reffereViolationAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                      </div>
                    </div>
                    <div class="dropFilesArea" id="dropFilesArea" style="max-height: 150px; overflow-y: auto;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="formButtonsBox" style="margin-top: 20px;">
          <div class="row">
            <div class="col-12">
              <div class="buttonsBox centerButtonsBox">
                <div class="btnStyle confirmBtnGreen popupBtn reffereVioltionBtn" id="editCasePriceBtn">تأكيد</div>
                <div class="btnStyle cancelBtn popupBtn ${closeFooterId}" id="${closeFooterId}" data-dismiss="modal" aria-label="Close">إلغاء</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  functions.declarePopup(["generalPopupStyle", "greenPopup", "editPopup"], popupHtml);

  // Add custom CSS for scrollbar styling (optional)
  const style = document.createElement('style');
  style.textContent = `
    .scrollable-popup-body::-webkit-scrollbar {
      width: 8px;
    }
    .scrollable-popup-body::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .scrollable-popup-body::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    .scrollable-popup-body::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    .dropFilesArea::-webkit-scrollbar {
      width: 5px;
    }
    .dropFilesArea::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .dropFilesArea::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);

  // Add close button handlers
  $(`#${closeHeaderId}, #${closeFooterId}`).on("click", function () {
    functions.closePopup();
  });

  let numberOfDaysBefore = functions.getViolationStartDate(3);
  functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today");

  let violationRefferedDate = $(".reffereViolationDate").val();
  let violationRefferedComments = $(".reffereViolationComments").val();

  let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"];
  let allAttachments;
  let countOfFiles;

  $("#reffereViolationAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
        <div class="file">
          <p class="fileName">${allAttachments[i].name}</p>
          <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
        </div>
      `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < allAttachments.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(allAttachments[i]);
        }
      }
      allAttachments = fileBuffer.files;
      countOfFiles = allAttachments.length;
      if (countOfFiles == 0) {
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        $(e.currentTarget).val("");
      }
    }
  });

  $(".reffereViolationDate").on("change", (e) => {
    violationRefferedDate = $(e.currentTarget).val();
  });

  $(".reffereViolationComments").on("keyup", (e) => {
    violationRefferedComments = $(e.currentTarget).val().trim();
  });

  $(".reffereVioltionBtn").on("click", (e) => {
    if (violationRefferedDate != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        $(".overlay").addClass("active");
        validatedViolations.reffereViolationAPIResponse(
          TaskId,
          ViolationId,
          OffenderType,
          TotalPrice,
          violationRefferedDate,
          violationRefferedComments,
          "#reffereViolationAttach",
          IsDublicated,
          Equipments_Count
        );
      } else {
        functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بالإحالة");
      }
    } else {
      functions.warningAlert("من فضلك قم بتحديد تاريخ الإحالة الخاص بالمخالفة");
    }
  });
};
validatedViolations.reffereViolationAPIResponse = (
  TaskId,
  ViolationId,
  OffenderType,
  TotalPrice,
  violationRefferedDate,
  // ReferralNumber,
  Comments = "",
  attachInput,
  IsDublicated,
  Equipments_Count
) => {
  let DouplePrice = TotalPrice * 2 + 10000;

  // Get the stored referral status
  let referralStatus = $("body").data("currentReferralStatus") || "";

  let TotalPriceDueEquation;

  if (OffenderType === "Vehicle") {
    TotalPriceDueEquation = IsDublicated ? TotalPrice : DouplePrice;
  } else if (OffenderType === "Equipment") {
    TotalPriceDueEquation = TotalPrice + (Equipments_Count * 10000);
  }

  let request = {
    Data: {
      ID: TaskId,
      Title: OffenderType == "Vehicle" ? "تم حظر عربة" : OffenderType == "Equipment" ? "تم حظر معدة" : "تم إحالة الطلب للنيابة المختصة",
      Status: "UnderReview",
      ViolationId: ViolationId,
      TotalPriceDue: TotalPriceDueEquation,
      ReferralStatus: referralStatus,
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
      // First upload task attachment
      validatedViolations.uploadEditTaskAttachment(
        TaskId,
        "ViolationsCycle",
        attachInput,
      );

      // Then add new case with appropriate payload based on offender type
      validatedViolations.addNewCase(
        TaskId,
        ViolationId,
        violationRefferedDate,
        // ReferralNumber,
        Comments,
        OffenderType,
      );
    })
    .catch((err) => { });
};

validatedViolations.addNewCase = (
  TaskId,
  violationId,
  violationRefferedDate,
  // ReferralNumber,
  Comments = "",
  OffenderType,
) => {
  // Determine payload based on offender type
  let request;
  let caseStatus = "";

  if (OffenderType === "Quarry") {
    caseStatus = "قيد انتظار رقم الإحالة";
    request = {
      Request: {
        Title: "إحالة محجر إلى النيابة",
        // Status: "قيد الانتظار القطاع",
        Status: caseStatus,
        ViolationId: violationId,
        TaskId: TaskId,
        // ReferralNumber: ReferralNumber,
        RefferedDate: violationRefferedDate,
        Comments: Comments,
        OffenderType: OffenderType
      },
    };
  } else if (OffenderType === "Vehicle" || OffenderType === "Equipment") {
    caseStatus = "قيد انتظار رقم القيد";
    request = {
      Request: {
        Title: OffenderType === "Vehicle" ? "تم حظر عربة" : "تم حظر معدة",
        // Status: "قيد انتظار الرقم القضائي",
        Status: caseStatus,
        ViolationId: violationId,
        TaskId: TaskId,
        // VehicleRegistrationNumber: ReferralNumber,
        RefferedDate: violationRefferedDate,
        Comments: Comments,
        OffenderType: OffenderType
      },
    };
  }

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data.d.Status) {
        // Get the Case ID from response
        let CaseId = data.d.Result?.Id;
        if (CaseId) {
          // Add attachment record for the case 
          validatedViolations.addNewCaseAttachmentRecord(
            CaseId,
            "إحالة إلى النيابة",
            "#reffereViolationAttach",
            "تم إحالة المخالفة وتسجيلها في سجل القضايا بنجاح",
            Comments
          );
        } else {
          $(".overlay").removeClass("active");
          functions.sucessAlert("تم إحالة المخالفة وتسجيلها في سجل القضايا");
        }
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ أثناء حفظ القضية");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في الاتصال بالخادم");
    });
};
validatedViolations.addNewCaseAttachmentRecord = (
  CaseId,
  uploadPhase,
  attachInput,
  Message = "",
  Comments = ""
) => {
  let request = {
    Request: {
      Title: "New Attachment Record",
      CaseId: CaseId,
      UploadPhase: uploadPhase,
      Comments: Comments,
    },
  };

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data.d.Status) {
        let RecordId = data.d.Result.Id;
        validatedViolations.uploadCaseAttachments(
          RecordId,
          attachInput,
          "CasesAttachments",
          Message
        );
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في الاتصال بالخادم");
    });
};
validatedViolations.uploadCaseAttachments = (
  RecordId,
  attachInput,
  ListName,
  Message
) => {
  let Data = new FormData();
  Data.append("itemId", RecordId);
  Data.append("listName", ListName);

  // Get all files from the input
  let files = $(attachInput)[0].files;
  for (let i = 0; i < files.length; i++) {
    Data.append("file" + i, files[i]);
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert(Message);
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال المرفقات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};
//////////////////////////////////////////////////////

validatedViolations.requestNewPetition = (
  violationTaskID,
  violationID,
  violationCode,
) => {
  $(".overlay").removeClass("active");

  // Generate unique IDs for close buttons
  const closeHeaderId = "closePetitionHeader_" + Math.random().toString(36).substr(2, 9);
  const closeFooterId = "closePetitionFooter_" + Math.random().toString(36).substr(2, 9);

  let popupHtml = `
    <div class="popupHeader" style="display: flex; justify-content: space-between; align-items: center;">
      <div class="violationsCode"> 
        <p>إضافة التماس للمخالفة رقم (${violationCode})</p>
      </div>
      <div class="btnStyle cancelBtn popupBtn ${closeHeaderId}" id="${closeHeaderId}" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                    <label for="addPetitionComments" class="customLabel">موضوع الالتماس * </label>
                    <textarea class="form-control addPetitionComments petitionComments customTextArea" id="addPetitionComments" placeholder="أدخل سبب وموضوع تقديم الالتماس"></textarea>
                  </div>
                </div>
                <div class="col-12">
                  <div class="form-group customFormGroup">
                    <label for="addPetitionAttach" class="customLabel">إرفاق مستند الالتماس * </label>
                    <div class="fileBox" id="dropContainer">
                      <div class="inputFileBox">
                        <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                        <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                        <input type="file" class="customInput attachFilesInput addPetitionAttach form-control" id="addPetitionAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                      </div>
                    </div>
                    <div class="dropFilesArea" id="dropFilesArea"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="formButtonsBox">
          <div class="row">
            <div class="col-12">   
              <div class="buttonsBox centerButtonsBox">
                <div class="btnStyle confirmBtnGreen popupBtn addPetitionBtn" id="addPetitionBtn">تأكيد</div>
                <div class="btnStyle cancelBtn popupBtn ${closeFooterId}" id="${closeFooterId}" data-dismiss="modal" aria-label="Close">إلغاء</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>`;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup"],
    popupHtml,
  );

  // Add close button handlers
  $(`#${closeHeaderId}, #${closeFooterId}`).on("click", function () {
    functions.closePopup();
  });

  let petitionComments = $("#addPetitionComments").val();
  let filesExtension = [
    "gif",
    "svg",
    "jpg",
    "jpeg",
    "png",
    "doc",
    "docx",
    "pdf",
    "xls",
    "xlsx",
    "pptx",
  ];
  let allAttachments;
  let countOfFiles;
  let request = {};

  $("#addPetitionAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
        <div class="file">
          <p class="fileName">${allAttachments[i].name}</p>
          <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
        </div>
      `);
    }
    $(".deleteFile").on("click", (event) => {
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < allAttachments.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(allAttachments[i]);
        }
      }
      allAttachments = fileBuffer.files;
      countOfFiles = allAttachments.length;
      if (countOfFiles == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert(
          "من فضلك أدخل الملفات بالمرفقات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });

  $("#addPetitionComments").on("keyup", (e) => {
    petitionComments = $(e.currentTarget).val().trim();
  });

  $(".addPetitionBtn").on("click", (e) => {
    if (petitionComments != "") {
      if (allAttachments != null && allAttachments.length > 0) {
        $(".overlay").addClass("active");
        functions
          .requester(
            "_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/Save",
            {
              Request: {
                Title: "تقديم بيان الإلتماس",
                Status: "التماس قيد الإنتظار",
                ViolationId: violationID,
                Comments: petitionComments,
              },
            },
          )
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
          })
          .then((data) => {
            if (data.d.Status) {
              let id = data.d.Result.Id;
              validatedViolations.addNewPetitionAttachment(id, "Petitions");
            } else {
              $(".overlay").removeClass("active");
              functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة");
            }
          })
          .catch((err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
          });
      } else {
        functions.warningAlert("من فضلك قم بإرفاق مستند الالتماس");
      }
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب وموضوع الالتماس");
    }
  });
};
validatedViolations.addNewPetitionAttachment = (petitionID, ListName) => {
  // let Data = new FormData();
  // let filesobj = {};
  // filesobj["itemId"] = petitionID;
  // filesobj["listName"] = ListName;
  //
  // for (let i = 0; i <= $(".detailsPopupForm #addPetitionAttach")[0].files.length; i++) {
  //
  //     // Data.append("file" + i, $(".detailsPopupForm #addPetitionAttach")[0].files[i]);
  //     filesobj[`file${i}`] = $(".detailsPopupForm #addPetitionAttach")[0].files[i];
  // }
  //
  // $.ajax({
  //     type: "POST",
  //     url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
  //     processData: false,
  //     contentType: "application/json; charset=utf-8",

  //     data: filesobj,
  //     success: (data) => {
  //
  //         $(".overlay").removeClass("active");
  //         functions.sucessAlert("تم تقديم الالتماس  بنجاح ");
  //     },
  //     error: (err) => {
  //         functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
  //         $(".overlay").removeClass("active");
  //
  //     },
  // });
  let Data = new FormData();
  Data.append("itemId", petitionID);
  Data.append("listName", ListName);
  for (
    let i = 0;
    i <= $(".detailsPopupForm #addPetitionAttach")[0].files.length;
    i++
  ) {
    Data.append(
      "file" + i,
      $(".detailsPopupForm #addPetitionAttach")[0].files[i],
    );
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم تقديم الإلتماس بنجاح");
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};
validatedViolations.uploadEditTaskAttachment = (
  TaskId,
  ListName,
  attachInput,
) => {
  let Data = new FormData();
  Data.append("itemId", TaskId);
  Data.append("listName", ListName);

  let files = $(attachInput)[0].files;
  for (let i = 0; i < files.length; i++) {
    Data.append("file" + i, files[i]);
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => { },
    error: (err) => { },
  });
};
validatedViolations.uploadPaymentReceiptsAttachment = (
  TaskId,
  ListName,
  offenderType,
) => {
  let Data = new FormData();
  Data.append("itemId", TaskId);
  Data.append("listName", ListName);
  let count = 0;
  let count2 = 0;

  if (offenderType !== "Equipment") {
    let i;
    for (i = 0; i < $("#attachQuarryPaymentReceipt")[0].files.length; i++) {
      Data.append("file" + i, $("#attachQuarryPaymentReceipt")[0].files[i]);
    }
    let j;
    for (
      j = i;
      count < $("#attachLawRoyaltyPaymentReceipt")[0].files.length;
      j++
    ) {
      Data.append(
        "file" + j,
        $("#attachLawRoyaltyPaymentReceipt")[0].files[count],
      );
      count++;
    }
    for (
      let k = j;
      count2 < $("#attachEquipmentsPaymentReceipt")[0].files.length;
      j++
    ) {
      Data.append(
        "file" + j,
        $("#attachEquipmentsPaymentReceipt")[0].files[count2],
      );
      count2++;
    }
  } else {
    Data.append(
      "file" + 0,
      $("#attachEquipmentsPaymentReceipt")[0].files[count2],
    );
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");

      // Get the status from the request that was stored in the form
      let requestData = $(".paymentForm").data("lastRequest") || {};
      let status = requestData?.Data?.Status || "Paid";
      let isInstallment = requestData?.Data?.Violation?.IsInstallment || false;

      if (status === "UnderPayment") {
        functions.sucessAlert("تم تسديد القسط بنجاح");
      } else if (status === "Paid") {
        if (isInstallment) {
          functions.sucessAlert("تم سداد آخر قسط وإنهاء المخالفة");
        } else {
          functions.sucessAlert("تم سداد المبلغ بالكامل وإنهاء المخالفة");
        }
      }
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};


validatedViolations.violationExceedTimeStatusChange = (taskId, violationId) => {
  let request = {
    Data: {
      ID: taskId,
      Title: "تم تجاوز مدة السداد",
      Status: "Exceeded",
      ViolationId: violationId,
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
      // validatedViolations.getValidatedViolations(1, true)
      window.location.reload();
    })
    .catch((err) => { });
};
// // Common utility for popup close buttons
// validatedViolations.popupUtils = {
//   // Generate unique IDs for close buttons
//   generateCloseIds: (prefix) => {
//     const uniqueId = Math.random().toString(36).substr(2, 9);
//     return {
//       headerId: `${prefix}_header_${uniqueId}`,
//       footerId: `${prefix}_footer_${uniqueId}`
//     };
//   },

//   // Add close button handlers
//   addCloseHandlers: (headerId, footerId) => {
//     $(`#${headerId}, #${footerId}`).on("click", function () {
//       functions.closePopup();
//     });
//   },

//   // Create popup header with close button
//   createHeader: (title, closeId) => `
//     <div class="popupHeader" style="display: flex; justify-content: space-between;">
//       <div class="violationsCode"> 
//         <p>${title}</p>
//       </div>
//       <div class="btnStyle cancelBtn popupBtn ${closeId}" id="${closeId}" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
//         <i class="fa-solid fa-x"></i>
//       </div>
//     </div>
//   `,

//   // Create footer with close button
//   createFooter: (closeId, customButtons = '') => `
//     <div class="formButtonsBox">
//       <div class="row">
//         <div class="col-12">
//           <div class="buttonsBox centerButtonsBox">
//             ${customButtons}
//             <div class="btnStyle cancelBtn popupBtn ${closeId}" id="${closeId}" data-dismiss="modal" aria-label="Close">إغلاق</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `,

//   // Wrap content with header and footer
//   wrapPopup: (title, content, customButtons = '') => {
//     const ids = validatedViolations.popupUtils.generateCloseIds('popup');
//     const header = validatedViolations.popupUtils.createHeader(title, ids.headerId);
//     const footer = validatedViolations.popupUtils.createFooter(ids.footerId, customButtons);

//     setTimeout(() => {
//       validatedViolations.popupUtils.addCloseHandlers(ids.headerId, ids.footerId);
//     }, 100);

//     return `
//       ${header}
//       ${content}
//       ${footer}
//     `;
//   }
// };

const ViolationHistoryLogs = () => {

  let selectedViolationId = null;
  let selectedViolationCode = null;
  let trackHistoryTable = null;

  // ===============================
  //  فتح المودال
  // ===============================
  $(".contentContainer").on("click", ".violationHistory", function (e) {
    e.preventDefault();
    e.stopPropagation();

    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");

    $("#trackHistoryModal").modal("show");
  });

  // ===============================
  //  إغلاق المودال - Close button handlers
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

  // Close button in header
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
  //  لما المودال يفتح
  // ===============================
  $(".track-history-modal").on("shown.bs.modal", function () {

    $(".track-history-violation-code").text(selectedViolationCode);

    const request = {
      Request: {
        ViolationId: selectedViolationId,
      },
    };

    const tableElement = $("#trackHistoryTable");

    // init
    if (!trackHistoryTable) {

      trackHistoryTable = tableElement.DataTable({
        processing: true,
        paging: false,
        responsive: true,
        destroy: true,
        // ordering: false,
        // searching: false,
        // info: false,

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
          {
            data: null,
            render: (data, type, row, meta) => {
              return meta.row;
            }
          },
          {
            data: "Status",
            render: (data) => {
              return data || "-";
            }
          },
          {
            data: "Created",
            render: (data) =>
              data ? functions.getFormatedDate(data) : "-"
          },
          {
            data: "CreatedBy",
            render: (data) => {
              return data || "-";
            }
          },
          {
            data: "Comment",
            render: (data) => {
              return data || "-";
            }
          }
        ],

        language: {
          emptyTable: "لا توجد بيانات",
        }
      });

    } else {

      // just Reload 
      trackHistoryTable.ajax.reload();
    }
  });

  // ===============================
  //  لما المودال يقفل
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


export default validatedViolations;

