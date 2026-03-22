import functions from "../Shared/functions";
import pagination from "../Shared/Pagination";

let petitionsLog = {};
petitionsLog.pageIndex = 1;
petitionsLog.destroyTable = false;

petitionsLog.getPetitions = (Status = "All", pageIndex = 1, isFiltered = false, ViolationSector = null, ViolationType = null, PetitionStatus = null) => {
  // Check if theCode field has a value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    $(".PreLoader").removeClass("active");
    return;
  }

  // Determine the ViolationCode value
  let ViolationCodeValue;
  if (isFiltered && ViolationType) {
    // If filtered, use the passed ViolationType
    ViolationCodeValue = ViolationType;
  } else {
    // Otherwise use the input field value (which will be empty after reset)
    ViolationCodeValue = $("#violationCode").val();
  }

  let ShownRows = 10;

  // Determine status value based on parameters or page context
  let PetitionStatusVal;
  if (isFiltered && PetitionStatus) {
    PetitionStatusVal = PetitionStatus;
  } else {
    PetitionStatusVal = $("#petitionStatus").children("option:selected").val() || Status;
  }

  // Handle theCode based on violation category
  const theCode = violationCategoryValue == "Quarry"
    ? { QuarryCode: $("#theCode").val() }
    : { CarNumber: $("#theCode").val() };

  // Use provided pageIndex or current pagination page
  const currentPage = pageIndex || Number(pagination.currentPage) || 1;

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/Search",
      {
        Request: {
          ...theCode,
          RowsPerPage: ShownRows,
          PageIndex: currentPage,
          ColName: "Created",
          SortOrder: "desc",
          ViolationId: 0,
          ViolationCode: ViolationCodeValue, // Use the determined value
          Status: PetitionStatusVal,
          IsPetition: true,
          ViolatorCompany: $("#ViolatorCompany").val(),
          ViolatorName: $("#ViolatorName").val(),
          OffenderType: $("#violationCategory").val() || "",
          CreatedFrom: $("#createdFrom").val()
            ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : "",
          CreatedTo: $("#createdTo").val()
            ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : "",
        },
      },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".PreLoader").removeClass("active");
      let ValidatedViolation = [];
      let ItemsData = data.d.Result;

      if (data.d.Result.GridData != null && data.d.Result.GridData.length > 0) {
        Array.from(data.d.Result.GridData).forEach((element) => {
          ValidatedViolation.push(element);
        });

        // Only show pagination if there are results AND total pages > 0
        if (ItemsData.TotalPageCount > 0 && ValidatedViolation.length > 0) {
          petitionsLog.setPaginations(ItemsData.TotalPageCount, ShownRows);
          $("#paginationID").show();
        } else {
          $("#paginationID").hide();
        }
      } else {
        ValidatedViolation = [];
        // Hide pagination when no results
        $("#paginationID").hide();
      }

      petitionsLog.ValidatedPetitionsTable(
        ValidatedViolation,
        petitionsLog.destroyTable,
        ShownRows,
      );
      petitionsLog.pageIndex = ItemsData.CurrentPage;
    })

    // .then((data) => {
    //   $(".PreLoader").removeClass("active");
    //   let ValidatedViolation = [];
    //   let ItemsData = data.d.Result;

    //   if (data.d.Result.GridData != null) {
    //     if (data.d.Result.GridData.length > 0) {
    //       Array.from(data.d.Result.GridData).forEach((element) => {
    //         ValidatedViolation.push(element);
    //       });
    //     } else {
    //       ValidatedViolation = [];
    //     }
    //   }
    //   petitionsLog.setPaginations(ItemsData.TotalPageCount, ShownRows);
    //   petitionsLog.ValidatedPetitionsTable(
    //     ValidatedViolation,
    //     petitionsLog.destroyTable,
    //     ShownRows,
    //   );
    //   petitionsLog.pageIndex = ItemsData.CurrentPage;
    // })
    .catch((err) => {
      $(".PreLoader").removeClass("active");
      console.error("Error fetching petitions:", err);
    });
};

petitionsLog.setPaginations = (TotalPages, RowsPerPage) => {
  if (TotalPages > 0) {
    // Clear existing pagination first
    $("#paginationID").empty();

    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", () => {
      // When pagination changes, get current filter state
      const currentStatus = $("#petitionStatus").val() ||
        (functions.getPageName() === "PendingPetitionsLog" ? "التماس قيد الإنتظار" : "All");

      // Check if we're in filtered mode
      const hasFilters = $("#violationCode").val() ||
        $("#violationCategory").val() ||
        $("#theCode").val() ||
        $("#createdFrom").val() ||
        $("#createdTo").val() ||
        $("#ViolatorCompany").val() ||
        $("#ViolatorName").val();

      if (hasFilters) {
        // Re-apply filters with new page
        petitionsLog.filterPetitionsLog(new Event('click'), currentStatus);
      } else {
        // Just fetch with current page
        petitionsLog.getPetitions(currentStatus, pagination.currentPage, false);
      }
    });
    pagination.activateCurrentPage();

    // Show pagination container
    $("#paginationID").show();
  } else {
    // Hide pagination if no pages
    $("#paginationID").hide();
  }
};

// petitionsLog.setPaginations = (TotalPages, RowsPerPage) => {
//   if (TotalPages > 0) {
//     pagination.draw("#paginationID", TotalPages, RowsPerPage);
//     pagination.start("#paginationID", () => {
//       // When pagination changes, get current filter state
//       const currentStatus = $("#petitionStatus").val() ||
//         (functions.getPageName() === "PendingPetitionsLog" ? "التماس قيد الإنتظار" : "All");

//       // Check if we're in filtered mode
//       const hasFilters = $("#violationCode").val() ||
//         $("#violationCategory").val() ||
//         $("#theCode").val() ||
//         $("#createdFrom").val() ||
//         $("#createdTo").val() ||
//         $("#ViolatorCompany").val() ||
//         $("#ViolatorName").val();

//       if (hasFilters) {
//         // Re-apply filters with new page
//         petitionsLog.filterPetitionsLog(new Event('click'), currentStatus);
//       } else {
//         // Just fetch with current page
//         petitionsLog.getPetitions(currentStatus, pagination.currentPage, false);
//       }
//     });
//     pagination.activateCurrentPage();
//   }
// };

petitionsLog.filterPetitionsLog = (e, defaultStatus = "All") => {
  e.preventDefault();

  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let PetitionStatusVal = $("#petitionStatus").children("option:selected").val();

  let ViolationType;
  let ViolationSector;
  let PetitionStatus;

  // Get current filter values
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();
  const violationCodeValue = $("#violationCode").val();
  const violatorCompanyValue = $("#ViolatorCompany").val();
  const violatorNameValue = $("#ViolatorName").val();
  const createdFromValue = $("#createdFrom").val();
  const createdToValue = $("#createdTo").val();

  // Check if theCode has value but violationCategory is empty
  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    return;
  }

  // Check if at least one filter has value - INCLUDING violationCategory
  if (
    (!ViolationSectorVal || ViolationSectorVal === "0" || ViolationSectorVal === "") &&
    (!ViolationTypeVal || ViolationTypeVal === "0" || ViolationTypeVal === "") &&
    (!PetitionStatusVal || PetitionStatusVal === "") &&
    (!violationCodeValue || violationCodeValue === "") &&
    (!theCodeValue || theCodeValue === "") &&
    (!violatorCompanyValue || violatorCompanyValue === "") &&
    (!violatorNameValue || violatorNameValue === "") &&
    (!createdFromValue || createdFromValue === "") &&
    (!createdToValue || createdToValue === "") &&
    (!violationCategoryValue || violationCategoryValue === "") // ADD THIS LINE
  ) {
    functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
    return;
  }

  $(".PreLoader").addClass("active");

  // Convert values to proper types
  ViolationSector = ViolationSectorVal && ViolationSectorVal !== "0" ? Number(ViolationSectorVal) : null;
  ViolationType = ViolationTypeVal && ViolationTypeVal !== "0" ? Number(ViolationTypeVal) : null;
  PetitionStatus = PetitionStatusVal || defaultStatus;

  // Store values for reference
  petitionsLog.PetitionStatus = PetitionStatus;
  petitionsLog.ViolationCode = violationCodeValue;

  // Call getPetitions with filter parameters - start from page 1
  petitionsLog.getPetitions(
    defaultStatus,
    1, // Start from page 1 when filtering
    true, // isFiltered flag
    ViolationSector,
    ViolationType,
    PetitionStatus
  );
};

petitionsLog.resetFilter = (e, defaultStatus = "All") => {
  e.preventDefault();

  // Reset all filter fields
  $("#violationCode").val("");
  $("#violationCategory").val("");
  $("#theCode").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#petitionStatus").val("");
  $("#ViolatorCompany").val("");
  $("#ViolatorName").val("");

  // Also reset stored filter values
  petitionsLog.ViolationCode = ""; // Add this line
  petitionsLog.PetitionStatus = defaultStatus; // Reset this too

  // Also reset any hidden filter fields if they exist
  if ($("#violationSector").length) {
    $("#violationSector").val("0");
  }
  if ($("#TypeofViolation").length) {
    $("#TypeofViolation").val("0");
  }

  $(".PreLoader").addClass("active");

  // Reset pagination to first page
  if (pagination && typeof pagination.reset === 'function') {
    pagination.reset();
  }

  // Reset current page to 1
  pagination.currentPage = 1;

  // Fetch all petitions with default status
  petitionsLog.getPetitions(defaultStatus, 1, false);
};

petitionsLog.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");

    // First, enable both fields
    $theCodeField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val(""); // Disable and clear the field
    }
  });
};

const originalResetFilter = petitionsLog.resetFilter;
petitionsLog.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#theCode").prop("disabled", false);
};

petitionsLog.ValidatedPetitionsTable = (Petitions, destroyTable) => {
  let data = [];
  if (petitionsLog.destroyTable || destroyTable) {
    $("#PetitionsTable").DataTable().destroy();
  }
  let petitionViolation;
  let ViolationCode;

  if (Petitions.length > 0) {
    Petitions.forEach((Petition) => {
      petitionViolation =
        Petition.Task != null ? Petition.Task.Violation : "--";
      ViolationCode =
        petitionViolation.ViolationCode != ""
          ? petitionViolation.ViolationCode
          : "-";

      data.push([
        `<div class="violationId" data-petitionid=${Petition?.ID
        } data-petitionstatus="${Petition?.Status}" data-taskid="${Petition.Task?.ID
        }" data-violationcode="${petitionViolation.ViolationCode
        }" data-violationid="${Petition?.ViolationId}" data-totalprice="${petitionViolation.TotalPriceDue
        }" data-exdate="${functions.getFormatedDate(
          Petition.Task?.ReconciliationExpiredDate,
        )}" data-petitioncomments="${Petition.Comments}">${Petition.Task != null ? petitionViolation.ViolationCode : "---"
        }</div>`,
        `<div class='controls'>
            <div class='ellipsisButton'>
                <i class='fa-solid fa-ellipsis-vertical'></i>
            </div>
            <div class="hiddenListBox">
                <div class='arrow'></div>
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                    <li><a href="#" class="violationHistory" data-violationid="${Petition?.ViolationId}" data-violationcode="${petitionViolation.ViolationCode}" data-bs-toggle="modal" data-bs-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>
                </ul>
            </div>
        </div>`,
        `${functions.getFormatedDate(Petition?.Created)}`,
        `<div class="violationArName">${functions.getViolationArabicName(
          petitionViolation.OffenderType,
        )}</div>`,
        `${functions.getPetitionsStatus(Petition?.Status)}`,
        `<div class="petitionAttachments" data-petitionid="${Petition?.ID}" data-petitionnumber="${Petition?.ID}"><a href="#!" style="color: black;">المرفقات</a></div>`, // NEW: Attachments column
      ]);
    });
  }

  petitionsLog.destroyTable = true;
  let Table = functions.tableDeclare(
    "#PetitionsTable",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تاريخ الالتماس" },
      { title: "تصنيف المخالفة" },
      { title: "حالة الالتماس" },
      { title: "المرفقات" }, // NEW: Attachments column header
    ],
    false,
    false,
    "سجل الالتماسات.xlsx",
    "سجل الالتماسات",
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let UserId = _spPageContextInfo.userId;
  let petitionsTable = Table.rows().nodes().to$();

  functions.callSharePointListApi("Configurations").then((Users) => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        UserDetails = User;
      }
    });

    $.each(petitionsTable, (index, record) => {
      let Content;
      let jQueryRecord = $(record);

      let hiddenListBox = jQueryRecord
        .find(".controls")
        .children(".hiddenListBox");
      let petitionId = jQueryRecord.find(".violationId").data("petitionid");
      let petitionStatus = jQueryRecord
        .find(".violationId")
        .data("petitionstatus");
      let petitionID = jQueryRecord.find(".violationId").data("petitionid");
      let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
      let ViolationId = jQueryRecord.find(".violationId").data("violationid");
      let violationCode = jQueryRecord
        .find(".violationId")
        .data("violationcode");
      let ViolationTotalPrice = jQueryRecord
        .find(".violationId")
        .data("totalprice");
      let ExDate = jQueryRecord.find(".violationId").data("exdate");
      let PetitionComments = jQueryRecord
        .find(".violationId")
        .data("petitioncomments");

      // NEW: Attachments click handler
      jQueryRecord.find(".petitionAttachments").find("a").off('click').on('click', function (e) {
        e.preventDefault();
        $(".overlay").addClass("active");
        petitionsLog.getPetitionAttachmentsByPetitionId(petitionID, petitionID);
      });

      if (
        petitionStatus == "قيد الإنتظار" ||
        petitionStatus == "التماس قيد الإنتظار"
      ) {
        jQueryRecord
          .find(".controls")
          .children(".hiddenListBox")
          .find(".controlsList").append(`
                        <li><a href="#" class="approvePetition">قبول وتعديل المخالفة</a></li>
                        <li><a href="#" class="approveAndCancelPetition"> قبول وإلغاء المخالفة</a></li>
                        <li><a href="#" class="rejectPetition">رفض الالتماس</a></li>
                    `);
      }

      if (
        petitionsTable.length > 4 &&
        $(".hiddenListBox").height() > 110 &&
        jQueryRecord.is(":nth-last-child(-n + 4)")
      ) {
        $(".hiddenListBox").addClass("toTopDDL");
      }

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".itemDetails")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          petitionsLog.findPetitionsByID(petitionID, ExDate);
        });

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".violationHistory")
        .on("click", (e) => {
          // $(".overlay").addClass("active");
        });

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".approvePetition")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          petitionsLog.approvePetition(
            petitionID,
            ViolationId,
            ViolationCode,
            violationTaskID,
            ViolationTotalPrice,
            ExDate,
            PetitionComments,
            e,
          );
        });

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".approveAndCancelPetition")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          petitionsLog.approveAndCancelPetition(
            petitionID,
            ViolationId,
            ViolationCode,
            violationTaskID,
            ViolationTotalPrice,
            ExDate,
            PetitionComments,
            e,
          );
        });

      jQueryRecord
        .find(".controls")
        .children(".hiddenListBox")
        .find(".rejectPetition")
        .on("click", (e) => {
          $(".overlay").addClass("active");
          petitionsLog.rejectPetition(petitionID, ViolationId, violationCode);
        });
    });
    functions.getCurrentUserActions();
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
petitionsLog.findPetitionsByID = (petitionID, exDate) => {
  let request = {
    Id: petitionID,
  };

  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/FindById",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    })
    .then((data) => {
      // Remove overlay loading
      $(".overlay").removeClass("active");

      if (data && data.d && data.d.Result) {
        let petitionsData = data.d.Result;
        let petitionsId = petitionsData?.ID;
        let violationData = petitionsData.Task?.Violation;

        // Check if violationData exists
        if (!violationData) {
          functions.warningAlert("لا توجد بيانات للمخالفة");
          return;
        }

        let ExpiredDate;
        let date = exDate;

        // Handle date formatting safely
        if (date && date !== "-") {
          let DateYear = date.split("-")[2];
          if (DateYear > 2020) {
            ExpiredDate = date;
          } else {
            ExpiredDate = "-";
          }
        } else {
          ExpiredDate = "-";
        }

        // Format values with fallbacks
        const formatValue = (value, defaultValue = "----") => {
          return value && value !== "" && value !== null ? value : defaultValue;
        };

        const popupHtml = `
          <div class="petitionPopup" id="printJS-form">
            <div class="popupHeader">
              <div class="popupTitleBox">
                <div class="PetitionNumberBox">
                  <p class="PetitionNumber">تفاصيل التماس مخالفة رقم (${formatValue(violationData.ViolationCode, "")})</p>  
                </div>
                <div class="btnStyle cancelBtn popupBtn closePetitionDetailsPopup" id="closePetitionDetailsPopup" data-dismiss="modal" aria-label="Close">
                  <i class="fa-solid fa-x"></i>
                </div>
              </div> 
            </div>
            <div class="popupBody" style="max-height: 70vh; overflow-y: auto; overflow-x: hidden; padding: 20px;">
              <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                  <div class="formBox">
                    <div class="formBoxHeader">
                      <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الالتماس</p>
                    </div>
                    <div class="formElements">
                      <div class="row">
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="petitionCreatedDate" class="customLabel">تاريخ تقديم الالتماس</label>
                            <input class="form-control disabled customInput petitionCreatedDate" id="petitionCreatedDate" type="text" value="${functions.getFormatedDate(petitionsData.Created) || "----"}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="PetitionStatus" class="customLabel">الحالة</label>
                            <input class="form-control disabled customInput PetitionStatus" id="PetitionStatus" type="text" value="${formatValue(petitionsData.Status)}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="dateBeforePetition" class="customLabel">المدة القديمة</label>
                            <input class="form-control disabled customInput dateBeforePetition" id="dateBeforePetition" type="text" value="${ExpiredDate}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="petitionTotalOldPrice" class="customLabel">المبلغ القديم</label>
                            <input class="form-control disabled customInput petitionTotalOldPrice" id="petitionTotalOldPrice" type="text" value="${formatValue(violationData.ActualAmountPaid)}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="ReconciliationExpiredDate" class="customLabel">المدة الجديدة</label>
                            <input class="form-control disabled customInput ReconciliationExpiredDate" id="ReconciliationExpiredDate" type="text" value="${functions.getFormatedDate(petitionsData.Task?.ReconciliationExpiredDate) || "----"}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="petitionTotalPriceDue" class="customLabel">المبلغ الجديد</label>
                            <input class="form-control disabled customInput petitionTotalPriceDue" id="petitionTotalPriceDue" type="text" value="${formatValue(violationData.TotalPriceDue)}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-12">
                          <div class="form-group customFormGroup">
                            <label for="commentsPetition" class="customLabel">موضوع الالتماس</label>
                            <input class="form-control disabled customInput commentsPetition" id="commentsPetition" type="text" value="${formatValue(petitionsData.Comments)}" disabled>
                          </div> 
                        </div>
                        <div class="col-md-12 petitionsAttachmentsBoxes" id="petitionsAttachmentsBoxes">
                          <div class="feildInfoBoxe">
                            <label class="customLabel">المرفقات</label>
                          </div>
                          <div class="petitionsAttachBox" style="max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #eee; border-radius: 5px;"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="formContent">
                  <div class="formBox">
                    <div class="formBoxHeader">
                      <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
                    </div>
                    <div class="formElements">
                      <div class="row">
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violatorName" class="customLabel">إسم المخالف</label>
                            <input class="form-control disabled customInput violatorName" id="violatorName" type="text" value="${formatValue(violationData.ViolatorName)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                            <input class="form-control disabled customInput violatorCompany" id="violatorCompany" type="text" value="${formatValue(violationData.ViolatorCompany)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violationType" class="customLabel">نوع المخالفة</label>
                            <input class="form-control disabled customInput violationType" id="violationType" type="text" value="${formatValue(violationData.ViolationTypes?.Title || violationData.VehicleFine?.VehicleType)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="materialQuantity" class="customLabel">كمية الخام</label>
                            <input class="form-control disabled customInput materialQuantity" id="materialQuantity" type="text" value="${formatValue(violationData.VehicleFine?.Quantity || violationData.TotalQuantity)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="materialType" class="customLabel">نوع الخام</label>
                            <input class="form-control disabled customInput materialType" id="materialType" type="text" value="${formatValue(violationData.VehicleFine?.Material?.Title || violationData.Material?.Title)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violationGov" class="customLabel">المحافظة</label>
                            <input class="form-control disabled customInput violationGov" id="violationGov" type="text" value="${formatValue(violationData.Governrates?.Title)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violationZone" class="customLabel">منطقة الضبط</label>
                            <input class="form-control disabled customInput violationZone" id="violationZone" type="text" value="${formatValue(violationData.ViolationsZone)}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violationTime" class="customLabel">وقت الضبط</label>
                            <input class="form-control disabled customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A") || "----"}" disabled>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-group customFormGroup">
                            <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                            <input class="form-control disabled customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate) || "----"}" disabled>
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
                        <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;

        // Declare the popup
        functions.declarePopup(
          ["generalPopupStyle", "greenPopup", "editPopup", "petitionPopup"],
          popupHtml,
        );

        // Add custom CSS for scrollable popup
        const style = document.createElement('style');
        style.innerHTML = `
          .popupContainer .popupBody {
            max-height: 70vh;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px;
          }
          .popupContainer .popupBody::-webkit-scrollbar {
            width: 8px;
          }
          .popupContainer .popupBody::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .popupContainer .popupBody::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .popupContainer .popupBody::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          .petitionsAttachBox {
            max-height: 200px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
          }
          .petitionsAttachBox::-webkit-scrollbar {
            width: 5px;
          }
          .petitionsAttachBox::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 5px;
          }
          .petitionsAttachBox::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 5px;
          }
        `;
        document.head.appendChild(style);

        // Get attachments
        petitionsLog.getPetitionsAttachmentsById(petitionsId);

        // Add close button handlers
        $("#closePetitionDetailsPopup, #closeDetailsPopup").on("click", function () {
          $(".overlay").removeClass("active");
          $(".popupContainer").remove();
          // Remove the added style when popup closes
          $(style).remove();
        });

      } else {
        console.error("No data found for petition ID:", petitionID);
        functions.warningAlert("لم يتم العثور على بيانات الالتماس");
        $(".overlay").removeClass("active");
      }
    })
    .catch((err) => {
      console.error("Error in findPetitionsByID:", err);
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في جلب بيانات الالتماس");
    });
};
petitionsLog.getPetitionsAttachmentsById = (petitionsId) => {
  let request = {
    id: petitionsId,
    listName: "Petitions",
  };
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(request),
    success: (data) => {
      if (data != null) {
        let attachmentsData = data.d;
        if (attachmentsData.length > 0) {
          attachmentsData.forEach((attachData) => {
            $("#petitionsAttachmentsBoxes .petitionsAttachBox").append(`
                            <a class="attachment" style="text-decoration: none" target="_blank" href="${attachData.Url}" download="${attachData.Url}" title="${attachData.Name}">
                                <div class="attachImgBox">
                                    <img src="/Style Library/MiningViolations/images/file.png" alt="attach Image">
                                </div>
                                <div class="attachDataBox">
                                    <p class="attachName">${attachData.Name}</p>
                                    <span><i class="fa-solid fa-download"></i></span>
                                </div>
                            </a>
                            
                        `);
          });
        } else {
          // $("#petitionsAttachmentsBoxes .downloadAllFiles").hide()
          $("#petitionsAttachmentsBoxes .petitionsAttachBox").append(`
                            <p class="noAttachments">لا يوجد مرفقات</p>
                    `);
        }
      }
    },
    error: (xhr) => { },
  });
};
// if (ValidatedViolation.length > 0) {
//     ValidatedViolation.forEach(record => {
// let date = functions.getFormatedDate(record.ReconciliationExpiredDate)
// let DateYear = date.split("-")[2]
// let ExpiredDate;
// violationDate = functions.getFormatedDate(record.ReconciliationExpiredDate)
// if (CurrentDate > violationDate && DateYear > 2020 && TaskStatus == "Confirmed") {
//     validatedViolations.violationExceedTimeStatusChange(taskId, violationId)
// }
// if (DateYear > 2020) {
//     ExpiredDate = functions.getFormatedDate(record.ReconciliationExpiredDate)
// } else {
//     ExpiredDate = "-"
// }

///////////////////////

petitionsLog.approvePetition = (
  petitionID,
  violationID,
  violationCode,
  violationTaskID,
  ViolationTotalPrice,
  ExDate,
  petitionComments,
  e,
) => {
  // Remove overlay at start
  $(".overlay").removeClass("active");

  // Format date based on year
  const formatExpiredDate = (date) => {
    const DateYear = date.split("-")[2];
    return DateYear > 2020 ? date : "-";
  };

  // Format price display
  const formatPriceDisplay = (price) => {
    const priceParts = price.toString().split(".");
    return priceParts.length > 1
      ? `${functions.splitBigNumbersByComma(priceParts[0])}.${priceParts[1]}`
      : functions.splitBigNumbersByComma(price);
  };

  // Get violation code from current row
  const getViolationCode = () => {
    return $(e.currentTarget)
      .parents("tr")
      .first()
      .find(".violationId")
      .data("violationcode");
  };

  const ExpiredDate = formatExpiredDate(ExDate);
  const violationCodeFromRow = getViolationCode();

  // Popup HTML template
  const popupHtml = createPopupTemplate(violationCodeFromRow, petitionComments, formatPriceDisplay(ViolationTotalPrice), ExpiredDate);

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup", "petitionPopup"],
    popupHtml,
  );

  // Initialize variables
  let state = {
    allAttachments: undefined,
    newPriceInput: "",
    newDateInput: "",
    oldPriceInput: Number($("#priceBeforePetition").val().replace(/\,/g, "")),
    oldDateInput: $("#dateBeforePetition").val(),
    request: {}
  };

  const filesExtension = [
    "gif", "svg", "jpg", "jpeg", "png",
    "doc", "docx", "pdf", "xls", "xlsx", "pptx"
  ];

  // Setup event handlers
  setupCloseHandlers();
  setupFileUploadHandlers();
  setupInputHandlers(state);

  functions.inputDateFormat(".inputDate", "today");

  // Main approve button click handler
  $(".approvePetitionBtn").on("click", (e) => {
    $(".overlay").addClass("active");

    // Update state with current values
    updateStateFromInputs(state);

    // Validate at least one field has value
    if (isBothFieldsEmpty(state)) {
      showWarning("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم المبلغ أو التاريخ وبشكل صحيح");
      return;
    }

    // Prepare request data
    prepareRequest(state, violationTaskID, violationID, state.oldDateInput);

    // Handle based on which fields have values
    handleSubmission(state, e, petitionID, violationID, petitionComments);
  });

  // ========== Helper Functions ==========

  function createPopupTemplate(violationCode, comments, priceDisplay, expiredDate) {
    return `
      <div class="popupHeader" style="display: flex; justify-content: space-between;">
        <div class="violationsCode"> 
          <p>قبول وتعديل المخالفة رقم (${violationCode})</p>
        </div>
        <div class="btnStyle cancelBtn popupBtn closeApprovePetitionPopup" id="closeApprovePetitionPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                      <label for="petitionComments" class="customLabel">موضوع الالتماس</label>
                      <textarea class="form-control petitionComments customTextArea" id="petitionComments" value="${comments}" disabled>${comments}</textarea>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="row">
                      <div class="col-md-6 noPaddingBefore">
                        <div class="form-group customFormGroup">
                          <label for="priceBeforePetition" class="customLabel">المبلغ المستحق</label>
                          <input class="form-control disabled customInput priceBeforePetition" id="priceBeforePetition" type="text" value="${priceDisplay}" disabled>
                        </div> 
                      </div>
                      <div class="col-md-6 noPaddingAfter">
                        <div class="form-group customFormGroup">
                          <label for="dateBeforePetition" class="customLabel">المدة القديمة</label>
                          <input class="form-control disabled customInput dateBeforePetition" id="dateBeforePetition" type="text" value="${expiredDate}" disabled>
                        </div> 
                      </div>
                      <div class="col-md-6 noPaddingBefore">
                        <div class="form-group customFormGroup">
                          <label for="priceAfterPetition" class="customLabel">المبلغ الجديد</label>
                          <input class="form-control customInput priceAfterPetition" id="priceAfterPetition" type="text" placeholder="أدخل المبلغ الجديد">
                        </div>
                      </div>
                      <div class="col-md-6 noPaddingAfter">
                        <div class="form-group customFormGroup">
                          <label for="dateAfterPetition" class="customLabel">المدة الجديدة</label>
                          <div class="inputIconBox">
                            <input class="form-control customInput inputDate dateAfterPetition" id="dateAfterPetition" type="text" placeholder="MM/DD/YYYY">
                            <i class="fa-solid fa-calendar-days"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="form-group customFormGroup">
                      <label for="approvePetitionAttach" class="customLabel">إرفاق المؤيدات</label>
                      <div class="fileBox" id="dropContainer">
                        <div class="inputFileBox">
                          <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                          <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                          <input type="file" class="customInput attachFilesInput approvePetitionAttach form-control" id="approvePetitionAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                  <div class="btnStyle confirmBtnGreen popupBtn approvePetitionBtn" id="approvePetitionBtn">موافقة</div>
                  <div class="btnStyle cancelBtn popupBtn" id="closeApprovePetitionPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function setupCloseHandlers() {
    $("#closeApprovePetitionPopup, #closeApprovePetitionPopupFooter").on("click", () => {
      functions.closePopup();
    });
  }

  function setupFileUploadHandlers() {
    $("#approvePetitionAttach").on("change", handleFileUpload);
  }

  function handleFileUpload(e) {
    const files = $(e.currentTarget)[0].files;
    state.allAttachments = files;

    if (files.length > 0) {
      const dropArea = $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea");
      dropArea.show().empty();

      // Display files
      Array.from(files).forEach((file, index) => {
        dropArea.append(createFileElement(file.name, index));
      });

      // Validate file extensions
      validateFileExtensions(files, e);

      // Setup delete handlers
      setupDeleteHandlers(e);
    }
  }

  function createFileElement(fileName, index) {
    return `
      <div class="file">
        <p class="fileName">${fileName}</p>
        <span class="deleteFile" data-index="${index}"><i class="fa-sharp fa-solid fa-x"></i></span>
      </div>`;
  }

  function validateFileExtensions(files, e) {
    const invalidFiles = Array.from(files).filter(file => {
      const fileExt = file.name.split(".").pop().toLowerCase();
      return !filesExtension.includes(fileExt);
    });

    if (invalidFiles.length > 0) {
      functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      $(e.currentTarget).val("");
      state.allAttachments = undefined;
    }
  }

  function setupDeleteHandlers(e) {
    $(".deleteFile").on("click", (event) => {
      const index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();

      // Update files collection
      const fileBuffer = new DataTransfer();
      Array.from(state.allAttachments).forEach((file, i) => {
        if (index !== i) fileBuffer.items.add(file);
      });

      state.allAttachments = fileBuffer.files;

      if (state.allAttachments.length === 0) {
        $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
      }
    });
  }

  function setupInputHandlers(state) {
    // Price input validation
    $("#priceAfterPetition").on("keypress", (e) => {
      return functions.isDecimalNumberKey(e);
    });

    $("#priceAfterPetition").on("keyup", (e) => {
      const value = $(e.currentTarget).val().replace(/,/g, "");
      $(e.currentTarget).val(value.replace(/\B(?=(?:\d{3})+(?!\d))/g, ","));
      state.newPriceInput = Number(value);
    });

    // Date input handler
    $("#dateAfterPetition").on("change", (e) => {
      state.newDateInput = $(e.currentTarget).val();
    });
  }

  function updateStateFromInputs(state) {
    state.newPriceInput = $("#priceAfterPetition").val().replace(/,/g, "");
    state.newDateInput = $("#dateAfterPetition").val();
  }

  function isBothFieldsEmpty(state) {
    return (!state.newPriceInput || state.newPriceInput === "") &&
      (!state.newDateInput || state.newDateInput === "");
  }

  function prepareRequest(state, violationTaskID, violationID, oldDateInput) {
    const oldDateNewFormat = oldDateInput !== "-"
      ? `${oldDateInput.split("-")[1]}-${oldDateInput.split("-")[0]}-${oldDateInput.split("-")[2]}`
      : "";

    state.request = {
      request: {
        Data: {
          ID: violationTaskID,
          ViolationId: violationID,
          TotalPriceDue: Number(state.newPriceInput) || 0,
          ReconciliationOldExpiredDate: oldDateNewFormat,
          ReconciliationExpiredDate: state.newDateInput || "",
          Violation: {
            LawRoyalty: null,
            QuarryMaterialValue: null,
            TotalEquipmentsPrice: null,
          },
        },
      },
    };
  }

  function handleSubmission(state, e, petitionID, violationID, petitionComments) {
    const hasPrice = state.newPriceInput && state.newPriceInput !== "";
    const hasDate = state.newDateInput && state.newDateInput !== "";
    const hasAttachments = state.allAttachments?.length > 0;

    if (!hasAttachments) {
      showWarning("من فضلك قم بإرفاق المستند الخاص بقبول الالتماس");
      return;
    }

    // Validate price
    if (hasPrice && Number(state.newPriceInput) > state.oldPriceInput) {
      showWarning("من فضلك قم بإدخال المبلغ الجديد لا يتجاوز المبلغ المحدد في المخالفة");
      return;
    }

    // Validate date
    if (hasDate && state.oldDateInput !== "-") {

      const oldDateMoment = moment(state.oldDateInput, "DD-MM-YYYY");
      const newDateMoment = moment(state.newDateInput, "MM/DD/YYYY");

      if (newDateMoment.isBefore(oldDateMoment)) {
        showWarning("من فضلك قم بتحديد التاريخ الجديد للمصالحة لا يقل عن التاريخ المحدد في المخالفة");
        return;
      }
    }

    // if (hasDate && state.oldDateInput !== "-") {

    //   const oldDateParts = state.oldDateInput.split("-");
    //   const newDateParts = state.newDateInput.split("/");

    //   const oldDate = new Date(oldDateParts[2], oldDateParts[1] - 1, oldDateParts[0]);
    //   const newDate = new Date(newDateParts[2], newDateParts[0] - 1, newDateParts[1]);

    //   if (newDate < oldDate) {
    //     showWarning("من فضلك قم بتحديد التاريخ الجديد للمصالحة لا يقل عن التاريخ المحدد في المخالفة");
    //     return;
    //   }
    // }

    const getSuccessMessage = () => {
      if (hasPrice && hasDate) return "تم قبول الالتماس مع تعديل المبلغ والمدة الجديدة";
      if (hasPrice) return "تم قبول الالتماس مع تعديل المبلغ الجديد";
      if (hasDate) return "تم قبول الالتماس مع تعديل المدة الجديدة";
      return "";
    };

    petitionsLog.changePetitionStatus(
      e,
      petitionID,
      violationID,
      state.request,
      petitionComments,
      "قبول مع التعديل",
      getSuccessMessage()
    );
  }

  function showWarning(message) {
    functions.warningAlert(message);
    $(".overlay").removeClass("active");
  }


};
petitionsLog.approveAndCancelPetition = (
  petitionID,
  violationID,
  violationCode,
  violationTaskID,
  ViolationTotalPrice,
  ExDate,
  petitionComments,
  e,
) => {
  $(".overlay").removeClass("active");

  let ExpiredDate;
  let date = ExDate;
  let DateYear = date.split("-")[2];
  if (DateYear > 2020) {
    ExpiredDate = date;
  } else {
    ExpiredDate = "-";
  }

  let popupHtml = `
    <div class="popupHeader" style="display: flex; justify-content: space-between;">
        <div class="violationsCode"> 
            <p> قبول وإلغاء المخالفة رقم (${$(e.currentTarget).parents("tr").first().find(".violationId").data("violationcode")}) وإلغائها</p>
        </div>
        <div class="btnStyle cancelBtn popupBtn closeApproveCancelPetitionPopup" id="closeApproveCancelPetitionPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                                <h6>هل أنت متأكد من الموافقة على طلب الالتماس على المخالفة رقم (${violationCode}) وإلغائها</h6>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group customFormGroup">
                                    <label for="approveCancelPetitionAttach" class="customLabel">إرفاق المؤيدات (اختياري)</label>
                                    <div class="fileBox" id="dropContainer">
                                        <div class="inputFileBox">
                                            <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                            <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                            <input type="file" class="customInput attachFilesInput approveCancelPetitionAttach form-control" id="approveCancelPetitionAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                        </div>
                                    </div>
                                    <div class="dropFilesArea" id="dropFilesAreaApproveCancel"></div>
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
                            <div class="btnStyle confirmBtnGreen popupBtn approveAndCancelPetitionBtn" id="approveAndCancelPetitionBtn">موافقة</div>
                            <div class="btnStyle cancelBtn popupBtn" id="closeApproveCancelPetitionPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup", "petitionPopup"],
    popupHtml,
  );

  // Add close button handlers
  $("#closeApproveCancelPetitionPopup, #closeApproveCancelPetitionPopupFooter").on("click", function () {
    functions.closePopup();
  });

  let allAttachments;
  let filesExtension = [
    "gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"
  ];

  // Handle file attachment
  $("#approveCancelPetitionAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings("#dropFilesAreaApproveCancel")
        .show()
        .empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings("#dropFilesAreaApproveCancel").append(`
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

      if (allAttachments.length == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings("#dropFilesAreaApproveCancel")
          .hide();
      }
    });

    // Validate file extensions
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings("#dropFilesAreaApproveCancel")
          .hide();
        $(e.currentTarget).val("");
        allAttachments = null;
      }
    }
  });

  let request = {};
  $(".approveAndCancelPetitionBtn").on("click", (e) => {
    // Attachments are optional - no validation required
    $(".overlay").addClass("active");

    request = {
      request: {
        Data: {
          ID: violationTaskID,
          ViolationId: violationID,
          Status: "Cancelled",
        },
      },
    };

    petitionsLog.changePetitionStatus(
      e,
      petitionID,
      violationID,
      request,
      petitionComments,
      "قبول وإلغاء المخالفة",
      "تم قبول الالتماس مع إلغاء المخالفة",
      allAttachments
    );
  });
};
petitionsLog.changePetitionStatus = (
  e,
  petitionID,
  violationID,
  requestData,
  petitionComments,
  Status,
  successMessage,
  attachments = null // Add attachments parameter
) => {
  functions
    .requester(
      "_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/Save",
      {
        Request: {
          Title: "التماس موافق عليه",
          Status: Status,
          ViolationId: violationID,
          ID: petitionID,
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
        // First API call successful, now make second API call
        petitionsLog.editPetition(e, petitionID, violationID, requestData, successMessage, attachments);
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ ما, لم يتم تحديث حالة الالتماس");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
    });
};
petitionsLog.editPetition = (e, petitionID, violationID, requestData, successMessage, attachments = null) => {
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
      requestData,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (requestData?.request?.Data?.Status == "Cancelled") {
        // Upload attachments for cancelled petitions if they exist
        if (attachments && attachments.length > 0) {
          petitionsLog.uploadPetitionAttachmentDirect(
            petitionID,
            "Petitions",
            attachments,
            successMessage
          );
        } else {
          $(".overlay").removeClass("active");
          functions.sucessAlert(successMessage);
        }
      } else if (data.d.Status) {
        // Upload attachments for approved petitions if they exist
        if (attachments && attachments.length > 0) {
          petitionsLog.uploadPetitionAttachmentDirect(
            petitionID,
            "Petitions",
            attachments,
            successMessage
          );
        } else {
          // No attachments to upload, just show success
          $(".overlay").removeClass("active");
          functions.sucessAlert(successMessage);

          //petitionsLog.addNewPetitionAttachment(
          //   petitionID,
          //   "Petitions",
          //   successMessage,
          // );
        }
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("هناك خطأ في إرسال بيانات تعديل المهمة");
      }
    })
    .catch((err) => {
      console.log("editPetition err", err);
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في تعديل المهمة");
    });
};
petitionsLog.rejectPetition = (petitionId, violationID, violationCode) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
    <div class="popupHeader" style="display: flex; justify-content: space-between;">
        <div class="violationsCode"> 
            <p>رفض طلب الالتماس على المخالفة رقم (${violationCode})</p>
        </div>
        <div class="btnStyle cancelBtn popupBtn closeRejectPetitionPopup" id="closeRejectPetitionPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                                <h6>هل أنت متأكد من رفض طلب الالتماس على المخالفة رقم (${violationCode})</h6>
                                <div class="form-group customFormGroup">
                                    <label for="rejectPetitionComments" class="customLabel">سبب الرفض <span class="required-star">*</span></label>
                                    <textarea class="form-control rejectPetitionComments petitionComments customTextArea" id="rejectPetitionComments" placeholder="من فضلك قم بإدخال سبب الرفض"></textarea>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group customFormGroup">
                                    <label for="rejectPetitionAttach" class="customLabel">إرفاق المؤيدات (اختياري)</label>
                                    <div class="fileBox" id="dropContainer">
                                        <div class="inputFileBox">
                                            <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                            <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                            <input type="file" class="customInput attachFilesInput rejectPetitionAttach form-control" id="rejectPetitionAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                        </div>
                                    </div>
                                    <div class="dropFilesArea" id="dropFilesAreaReject"></div>
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
                            <div class="btnStyle confirmBtnGreen popupBtn rejectPetitionBtn" id="rejectPetitionBtn">تأكيد</div>
                            <div class="btnStyle cancelBtn popupBtn" id="closeRejectPetitionPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
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
  $("#closeRejectPetitionPopup, #closeRejectPetitionPopupFooter").on("click", function () {
    functions.closePopup();
  });

  let petitionRejectReason = "";
  let allAttachments;
  let filesExtension = [
    "gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"
  ];

  $("#rejectPetitionComments").on("keyup", (e) => {
    petitionRejectReason = $(e.currentTarget).val().trim();
  });

  // Handle file attachment
  $("#rejectPetitionAttach").on("change", (e) => {
    allAttachments = $(e.currentTarget)[0].files;
    if (allAttachments.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings("#dropFilesAreaReject")
        .show()
        .empty();
    }
    for (let i = 0; i < allAttachments.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings("#dropFilesAreaReject").append(`
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

      if (allAttachments.length == 0) {
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings("#dropFilesAreaReject")
          .hide();
      }
    });

    // Validate file extensions
    for (let i = 0; i < allAttachments.length; i++) {
      let fileSplited = allAttachments[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings("#dropFilesAreaReject")
          .hide();
        $(e.currentTarget).val("");
        allAttachments = null;
      }
    }
  });

  $(".rejectPetitionBtn").on("click", (e) => {
    if (petitionRejectReason === "") {
      functions.warningAlert("من فضلك قم بإدخال سبب رفض الالتماس");
      return;
    }

    // Attachments are optional - no validation required

    $(".overlay").addClass("active");
    let request = {
      Request: {
        ID: petitionId,
        Title: "تم رفض الالتماس",
        ViolationId: violationID,
        Status: "التماس مرفوض",
        Comments: petitionRejectReason,
      },
    };

    petitionsLog.rejectPetitionAPI(request, petitionId, allAttachments, "تم رفض الالتماس بنجاح");
  });
};
petitionsLog.rejectPetitionAPI = (request, petitionId, attachments, successMessage) => {
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/Save",
      request,
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      if (data.d.Status) {
        // Upload attachments if they exist
        if (attachments && attachments.length > 0) {
          petitionsLog.uploadPetitionAttachmentDirect(
            petitionId,
            "Petitions",
            attachments,
            successMessage  // Pass the success message
          );
        } else {
          $(".overlay").removeClass("active");
          functions.sucessAlert(successMessage);
        }
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ أثناء تحديث حالة الالتماس");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ أثناء رفض الالتماس");
    });
};
petitionsLog.uploadPetitionAttachment = (
  petitionId,
  ListName,
  attachInput,
  actionType,
) => {
  let Data = new FormData();
  Data.append("itemId", petitionId);
  Data.append("listName", ListName);
  for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
    Data.append("file" + i, $(attachInput)[0].files[i]);
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      if (actionType == "Approve") {
        $(".overlay").removeClass("active");
        functions.sucessAlert("تم الموافقة على طلب الالتماس بنجاح");
      }
      if (actionType == "Reject") {
        $(".overlay").removeClass("active");
        functions.sucessAlert("تم رفض الالتماس المقدم");
      }
    },
    error: (err) => { },
  });
};
petitionsLog.addNewPetitionAttachment = (
  petitionID,
  ListName,
  petitionType,
) => {
  let Data = new FormData();
  Data.append("itemId", petitionID);
  Data.append("listName", ListName);

  if (petitionType == "accepted") {
    for (let i = 0; i <= $("#approvePetitionAttach")[0].files.length; i++) {
      Data.append("file" + i, $("#approvePetitionAttach")[0].files[i]);
    }
  } else {
    for (
      let i = 0;
      i <= $(".detailsPopupForm #rejectPetitionAttach")[0].files.length;
      i++
    ) {
      Data.append(
        "file" + i,
        $(".detailsPopupForm #rejectPetitionAttach")[0].files[i],
      );
    }
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");

      if (petitionType == "accepted") {
        functions.sucessAlert("تم قبول الالتماس بنجاح ");
      } else if (petitionType == "rejected") {
        functions.sucessAlert("تم رفض الالتماس بنجاح ");
      }
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
    },
  });
};
petitionsLog.uploadPetitionAttachmentDirect = (petitionId, ListName, attachments, successMessage) => {
  let Data = new FormData();
  Data.append("itemId", petitionId);
  Data.append("listName", ListName);

  for (let i = 0; i < attachments.length; i++) {
    Data.append("file" + i, attachments[i]);
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert(successMessage); // Use the passed success message
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرفاق الملفات");
      $(".overlay").removeClass("active");
    },
  });
};

petitionsLog.getPetitionAttachmentsByPetitionId = (PetitionId, petitionNumber) => {
  let request = {
    id: PetitionId,
    listName: "Petitions", // Using the same pattern as DetailsPopup
  };

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(request),
    success: (data) => {
      $(".overlay").removeClass("active");

      if (data && data.d && Array.isArray(data.d) && data.d.length > 0) {
        let attachmentsData = data.d;

        // Create a structure similar to what the popup expects
        let attachmentRecords = [{
          Attachments: attachmentsData.map(att => ({
            Url: att.Url,
            Name: att.Name
          })),
          UploadPhase: "مرفقات الالتماس",
          Created: new Date().toISOString(),
          Comments: ""
        }];

        petitionsLog.petitionAttachmentsDetailsPopup(
          PetitionId,
          petitionNumber,
          attachmentRecords
        );
      } else {
        // No attachments found
        petitionsLog.petitionAttachmentsDetailsPopup(
          PetitionId,
          petitionNumber,
          []
        );
      }
    },
    error: (xhr) => {
      console.error("Error fetching petition attachments:", xhr);
      $(".overlay").removeClass("active");
      functions.warningAlert("حدث خطأ في تحميل المرفقات");
    },
  });
};

// Popup for petition attachments details
petitionsLog.petitionAttachmentsDetailsPopup = (
  PetitionId,
  petitionNumber,
  PetitionAttachmentsRecords
) => {
  let popupHtml = `
    <div class="popupHeader attachPopup" style="display: flex; justify-content: space-between;">
        <div class="violationsCode"> 
            <p>مرفقات الالتماس رقم (${petitionNumber || "-----"})</p>
        </div>
        <div class="btnStyle cancelBtn popupBtn closePetitionAttachPopup" id="closePetitionAttachPopup" style="color: #fff;cursor: pointer;" data-dismiss="modal" aria-label="Close">
            <i class="fa-solid fa-x"></i>
        </div>
    </div> 
    <div class="popupBody">
        <div class="popupTableBox">
            <table id="petitionAttachmentsTable" class="table tableWithIcons popupTable"></table>
        </div>
        <div class="formButtonsBox">
            <div class="row">
                <div class="col-12">
                    <div class="buttonsBox centerButtonsBox">
                        <div class="btnStyle cancelBtn popupBtn closePetitionAttachPopupFooter" id="closePetitionAttachPopupFooter" data-dismiss="modal" aria-label="Close">إغلاق</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

  functions.declarePopup(
    ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
    popupHtml
  );

  petitionsLog.drawPetitionAttachmentsPopupTable(
    "#petitionAttachmentsTable",
    PetitionAttachmentsRecords
  );

  // Add close button handlers
  $("#closePetitionAttachPopup, #closePetitionAttachPopupFooter").on("click", function () {
    functions.closePopup();
  });
};

// Draw petition attachments table
petitionsLog.drawPetitionAttachmentsPopupTable = (
  TableId,
  PetitionAttachmentsRecords
) => {
  $(".overlay").removeClass("active");
  let data = [];
  let counter = 1;

  if (PetitionAttachmentsRecords.length > 0) {
    PetitionAttachmentsRecords.forEach((attchRecord) => {
      let attachedFilesData = attchRecord.Attachments || [];
      data.push([
        `<div class="attachCount">${counter}</div>`,
        `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
            ${petitionsLog.drawAttachmentsInTable(attachedFilesData)}
        </div>`,
        `<div class="attachUploadPhase">${attchRecord.UploadPhase || "----"}</div>`,
        `<div class="attachUploadDate">${functions.getFormatedDate(
          attchRecord.Created,
          "DD-MM-YYYY hh:mm A"
        )}</div>`,
        `<div class="attachComments">${attchRecord.Comments != ""
          ? attchRecord.Comments
          : "----"
        }</div>`,
      ]);
      counter++;
    });
  } else {
    data.push([
      `<div class="no-data">لا توجد مرفقات</div>`,
      "",
      "",
      "",
      ""
    ]);
  }

  let Table = functions.tableDeclare(
    TableId,
    data,
    [
      { title: "م", class: "tableCounter" },
      { title: "المرفقات", class: "attachBoxHeader" },
      { title: "سبب الإرفاق" },
      { title: "تاريخ الإرفاق" },
      { title: "ملاحظات" },
    ],
    false,
    false
  );

  let petitionAttachmentsLog = Table.rows().nodes().to$();
  $.each(petitionAttachmentsLog, (index, record) => {
    let jQueryRecord = $(record);
    let attachFiles = jQueryRecord.find(".attachFiles");
    let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

    if (attachFilesLength == 1) {
      attachFiles.find(".attchedFile").addClass("singleFile");
    }
    if (attachFilesLength == 2) {
      attachFiles.find(".attchedFile").addClass("multibleFiles");
    }
    if (attachFilesLength >= 3) {
      attachFiles.find(".attchedFile").addClass("manyFiles");
    }
  });
};

// Draw attachments in table (reuse from quarryViolationReferral)
petitionsLog.drawAttachmentsInTable = (Attachments) => {
  let attachmentsBox = ``;

  if (Attachments && Attachments.length > 0) {
    Attachments.forEach((attachment) => {
      attachmentsBox += `
        <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
            <div class="attachDetailsBox">
                <p class="attchedFileName">${attachment.Name}</p>
            </div>
            <span><i class="fa-solid fa-download"></i></span>
        </a>
      `;
    });
  } else {
    attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
  }
  return attachmentsBox;
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

      // ✅ Reload فقط
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

export default petitionsLog;





