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

      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            ValidatedViolation.push(element);
          });
        } else {
          ValidatedViolation = [];
        }
      }
      petitionsLog.setPaginations(ItemsData.TotalPageCount, ShownRows);
      petitionsLog.ValidatedPetitionsTable(
        ValidatedViolation,
        petitionsLog.destroyTable,
        ShownRows,
      );
      petitionsLog.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".PreLoader").removeClass("active");
      console.error("Error fetching petitions:", err);
    });
};

petitionsLog.setPaginations = (TotalPages, RowsPerPage) => {
  if (TotalPages > 0) {
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
  }
};
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
          Petition.Task.ReconciliationExpiredDate,
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
                            <li><a href="#" class="violationHistory" data-violationid="${Petition?.ViolationId}" data-violationcode="${Petition?.ViolationId}" data-toggle="modal" data-target="#trackHistoryModal">تتبع مرحلة المخالفة</a></li>
                        </ul>
                    </div>
                </div`,
        `${functions.getFormatedDate(Petition?.Created)}`,
        `<div class="violationArName">${functions.getViolationArabicName(
          petitionViolation.OffenderType,
        )}</div>`,
        `${functions.getPetitionsStatus(Petition?.Status)}`,

        // `${functions.getFormatedDate(Petition?.Created)}`,
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
      // { title: "تاريخ الإنشاء" },
      // { title: "الحد الأقصى للمصالحة" },
    ],
    false,
    false,
    "سجل الالتماسات.xlsx",
    "سجل الالتماسات",
  );
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

          // petitionsLog.approvePetition(petitionID, violationTaskID, ViolationId, violationCode,ExDate,PetitionComments)
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

          // petitionsLog.approvePetition(petitionID, violationTaskID, ViolationId, violationCode,ExDate,PetitionComments)
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
            <div class="popupBody">
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
                          <div class="petitionsAttachBox"></div>
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

        // Get attachments
        petitionsLog.getPetitionsAttachmentsById(petitionsId);

        // Add close button handlers
        $("#closePetitionDetailsPopup, #closeDetailsPopup").on("click", function () {
          $(".overlay").removeClass("active");
          $(".popupContainer").remove();
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
  $(".overlay").removeClass("active");

  let ExpiredDate;
  let date = ExDate;
  let DateYear = date.split("-")[2];
  let violationPriceFix =
    ViolationTotalPrice.toString().split(".").length > 1
      ? ViolationTotalPrice.toString().split(".")[0] +
      ViolationTotalPrice.toString().split(".")[1]
      : ViolationTotalPrice;
  if (DateYear > 2020) {
    ExpiredDate = date;
  } else {
    ExpiredDate = "-";
  }

  let popupHtml = `
                <div class="popupHeader">
                    <div class="violationsCode"> 
                        <p>الموافقة على الالتماس للمخالفة رقم (${$(
    e.currentTarget,
  )
      .parents("tr")
      .first()
      .find(".violationId")
      .data("violationcode")})</p>
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
                                                <textarea class="form-control petitionComments customTextArea" id="petitionComments" value="${petitionComments}" disabled>${petitionComments}</textarea>
                                            </div>
                                        </div>

                                        <div class="col-md-6">
                                            <div class="row">
                                                <div class="col-md-6 noPaddingBefore">
                                                    <div class="form-group customFormGroup">
                                                        <label for="priceBeforePetition" class="customLabel">المبلغ المستحق</label>
                                                        <input class="form-control disabled customInput priceBeforePetition" id="priceBeforePetition" type="text" value="${ViolationTotalPrice.toString().split(
        ".",
      ).length > 1
      ? functions.splitBigNumbersByComma(
        ViolationTotalPrice.toString().split(
          ".",
        )[0],
      ) +
      "." +
      ViolationTotalPrice.toString().split(
        ".",
      )[1]
      : functions.splitBigNumbersByComma(
        ViolationTotalPrice,
      )
    }" disabled>
                                                    </div> 
                                                </div>
                                                <div class="col-md-6 noPaddingAfter">
                                                    <div class="form-group customFormGroup">
                                                        <label for="dateBeforePetition" class="customLabel">المدة القديمة</label>
                                                        <input class="form-control disabled customInput dateBeforePetition" id="dateBeforePetition" type="text" value="${ExpiredDate}" disabled>
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
                                        <div class="btnStyle cancelBtn popupBtn closeApprovePetitionPopup" id="closeApprovePetitionPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

  // let petitionComments = $("#addPetitionComments").val()
  let oldPriceInput = $("#priceBeforePetition").val().replace(/\,/g, "");
  oldPriceInput = Number(oldPriceInput);
  let newPriceInput = $("#priceAfterPetition").val().replace(/\,/g, "");
  newPriceInput = Number(newPriceInput);
  let oldDateInput = $("#dateBeforePetition").val();
  let newDateInput = $("#dateAfterPetition").val();
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
  let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
  let request = {};

  functions.inputDateFormat(".inputDate", "today");

  $("#approvePetitionAttach").on("change", (e) => {
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
          "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط",
        );
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
        $(e.currentTarget).val("");
      }
    }
  });
  $("#priceAfterPetition").on("keypress", (e) => {
    return functions.isDecimalNumberKey(e);
  });
  $("#priceAfterPetition").on("keyup", (e) => {
    $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
    $(e.currentTarget).val(
      $(e.currentTarget)
        .val()
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, ","),
    );
    newPriceInput = $(e.currentTarget).val();
    newPriceInput = newPriceInput.replace(/\,/g, "");
    newPriceInput = Number(newPriceInput);
  });
  $("#dateAfterPetition").on("change", (e) => {
    newDateInput = $(e.currentTarget).val();
  });

  $(".approvePetitionBtn").on("click", (e) => {
    $(".overlay").addClass("active");
    let oldDateNewFormat =
      oldDateInput.split("-")[1] +
      "-" +
      oldDateInput.split("-")[0] +
      "-" +
      oldDateInput.split("-")[2];
    let newDateFormat = newDateInput;
    let isBiggerDate =
      moment(newDateFormat).isAfter(moment(oldDateNewFormat)) ||
      moment(newDateFormat).isSame(moment(oldDateNewFormat));
    request = {
      request: {
        Data: {
          ID: violationTaskID,
          ViolationId: violationID,
          TotalPriceDue: Number(newPriceInput),
          ReconciliationOldExpiredDate:
            oldDateInput == "-" ? "" : oldDateNewFormat,
          ReconciliationExpiredDate: newDateInput,
          Violation: {
            LawRoyalty: null,
            QuarryMaterialValue: null,
            TotalEquipmentsPrice: null,
          },
        },
      },
    };
    // request = {
    //   request: {
    //     Data: {
    //       ID: violationTaskID,
    //       ViolationId: violationID,
    //       ActualAmountPaid: Number(oldPriceInput),
    //       TotalPriceDue: Number(newPriceInput),
    //       ReconciliationOldExpiredDate:
    //         oldDateInput == "-" ? "" : oldDateNewFormat,
    //       ReconciliationExpiredDate: newDateInput,
    //     },
    //   },
    // };

    if (newPriceInput === "" || newDateInput == "") {
      functions.warningAlert(
        "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم المبلغ أو التاريخ وبشكل صحيح",
      );
      $(".overlay").removeClass("active");
    } else if (newPriceInput != "" && newDateInput != "") {
      // Add proper validation for both fields
      if (newPriceInput <= oldPriceInput) {
        if (allAttachments != undefined && allAttachments.length > 0) {
          petitionsLog.changePetitionStatus(
            e,
            petitionID,
            violationID,
            request,
            petitionComments,
            "قبول مع التعديل",
          );
        } else {
          functions.warningAlert(
            "من فضلك قم بإرفاق المستند الخاص بقبول الالتماس",
          );
          $(".overlay").removeClass("active");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بإدخال المبلغ الجديد لا يتجاوز المبلغ المحدد في المخالفة",
        );
        $(".overlay").removeClass("active");
      }
    } else if (newPriceInput != "" && newDateInput == "") {
      if (newPriceInput <= oldPriceInput) {
        if (allAttachments != undefined && allAttachments.length > 0) {
          $(".overlay").addClass("active");
          petitionsLog.changePetitionStatus(
            e,
            petitionID,
            violationID,
            request,
            petitionComments,
            "قبول مع التعديل",
          );
        } else {
          functions.warningAlert(
            "من فضلك قم بإرفاق مؤيدات الموافقة على الالتماس",
          );
          $(".overlay").removeClass("active");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بإدخال المبلغ الجديد لا يتجاوز المبلغ المحدد في المخالفة",
        );
        $(".overlay").removeClass("active");
      }
    } else if (newDateInput != "" && newPriceInput == "") {
      // remove condition on date must be > than old date [if (isBiggerDate replaced by newDateInput != "")]
      if (newDateInput != "") {
        if (allAttachments != undefined && allAttachments.length > 0) {
          $(".overlay").addClass("active");
          petitionsLog.changePetitionStatus(
            e,
            petitionID,
            violationID,
            request,
            petitionComments,
            "قبول مع التعديل",
          );
        } else {
          functions.warningAlert(
            "من فضلك قم بإرفاق مؤيدات الموافقة على الالتماس",
          );
          $(".overlay").removeClass("active");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بتحديد التاريخ الجديد للمصالحة لا يقل عن التاريخ المحدد في المخالفة",
        );
        $(".overlay").removeClass("active");
      }
    }
  });
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
  let violationPriceFix =
    ViolationTotalPrice.toString().split(".").length > 1
      ? ViolationTotalPrice.toString().split(".")[0] +
      ViolationTotalPrice.toString().split(".")[1]
      : ViolationTotalPrice;
  if (DateYear > 2020) {
    ExpiredDate = date;
  } else {
    ExpiredDate = "-";
  }

  let popupHtml = `
                <div class="popupHeader">
                    <div class="violationsCode"> 
                        <p>الموافقة على الالتماس للمخالفة رقم (${$(
    e.currentTarget,
  )
      .parents("tr")
      .first()
      .find(".violationId")
      .data("violationcode")}) وإلغائها</p>
                    </div>
                </div>
                <div class="popupBody">
                    <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                        <div class="formContent"> 
                            <div class="formBox">
                                <div class="formElements">
                                   <h6>هل أنت متأكد من الموافقة على طلب الالتماس على المخالفة رقم (${violationCode}) وإلغائها</h6>

                                </div>
                            </div>
                        </div>

                        <div class="formButtonsBox">
                            <div class="row">
                                <div class="col-12">   
                                    <div class="buttonsBox centerButtonsBox">
                                        <div class="btnStyle confirmBtnGreen popupBtn approveAndCancelPetitionBtn" id="approveAndCancelPetitionBtn">موافقة</div>
                                        <div class="btnStyle cancelBtn popupBtn closeApprovePetitionPopup" id="closeApprovePetitionPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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
  let request = {};
  $(".approveAndCancelPetitionBtn").on("click", (e) => {
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
        petitionsLog.editPetition(e, petitionID, violationID, requestData);
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
petitionsLog.editPetition = (e, petitionID, violationID, requestData) => {
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
        $(".overlay").removeClass("active");
        functions.sucessAlert("تم قبول وإلغاء الالتماس بنجاح ");
      } else if (data.d.Status) {
        // Second API call successful, now upload attachments
        petitionsLog.addNewPetitionAttachment(
          petitionID,
          "Petitions",
          "accepted",
        );
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("هناك خطأ في إرسال بيانات تعديل المهمة");
      }
    })
    .catch((err) => {
      console.log("editPetition err", err);
    });
};
petitionsLog.rejectPetition = (petitionId, violationID, violationCode) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>رفض طلب الالتماس على المخالفة رقم (${violationCode})</p>
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
                                        <label for="rejectPetitionComments" class="customLabel">سبب الرفض</label>
                                        <textarea class="form-control rejectPetitionComments petitionComments customTextArea" id="rejectPetitionComments" placeholder="من فضلك قم بإدخال سبب الرفض"></textarea>
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
                                <div class="btnStyle cancelBtn popupBtn closeRejectPetitionPopup" id="closeRejectPetitionPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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
  let petitionRejectReason = $("#rejectPetitionComments").val();
  let request = {};

  $("#rejectPetitionComments").on("keyup", (e) => {
    petitionRejectReason = $(e.currentTarget).val().trim();
  });

  $(".rejectPetitionBtn").on("click", (e) => {
    if (petitionRejectReason != "") {
      $(".overlay").addClass("active");
      request = {
        Request: {
          ID: petitionId,
          Title: "تم رفض الالتماس",
          ViolationId: violationID,
          Status: "التماس مرفوض",
          Comments: petitionRejectReason,
        },
      };

      petitionsLog.rejectPetitionAPI(request, petitionId);
    } else {
      functions.warningAlert("من فضلك قم بإدخال سبب رفض الالتماس");
    }
  });
};
petitionsLog.rejectPetitionAPI = (request, petitionId) => {
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
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم رفض الالتماس المقدم");
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
const ViolationHistoryLogs = () => {

  let selectedViolationId = null;
  let selectedViolationCode = null;
  let trackHistoryTable = null;

  // ===============================
  // 🔥 فتح المودال
  // ===============================
  $(".contentContainer").on("click", ".violationHistory", function () {

    selectedViolationId = $(this).data("violationid");
    selectedViolationCode = $(this).data("violationcode");

    $("#trackHistoryModal").modal("show");
  });

  // ===============================
  // 🔥 لما المودال يفتح
  // ===============================
  $(".track-history-modal").on("shown.bs.modal", function () {

    $(".modal-violation-code").text(selectedViolationCode);

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
          { data: "Id" },
          { data: "Status" },
          {
            data: "Created",
            render: (data) =>
              data ? functions.getFormatedDate(data) : "-"
          },
          { data: "CreatedBy" },
          { data: "Comment" }
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

    $(".modal-violation-code").text("");

    if (trackHistoryTable) {
      trackHistoryTable.clear().destroy();
      trackHistoryTable = null;
    }

    $("#trackHistoryTable tbody").empty();
  });

};

ViolationHistoryLogs();

export default petitionsLog;





