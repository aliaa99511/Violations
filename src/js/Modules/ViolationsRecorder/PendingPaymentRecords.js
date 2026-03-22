import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let pendingPaymentRecords = {};
pendingPaymentRecords.pageIndex = 1;
pendingPaymentRecords.destroyTable = false;

pendingPaymentRecords.getPendingPayment = (
    pageIndex = 1,
    destroyTable = false,
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
    ViolationGeneralSearch = ""
) => {
    let UserId = _spPageContextInfo.userId;

    let request = {
        Data: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            Status: "UnderPayment",
            Sector: UserId,
            ViolationType: ViolationType,
            GlobalSearch: $("#violationSearch").val(),
            OffenderType: $("#violationCategory").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
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
            let pendingPaymentData = [];
            let ItemsData = data.d.Result;
            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        pendingPaymentData.push(element);
                    });
                } else {
                    pendingPaymentData = [];
                }
            }
            pendingPaymentRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            pendingPaymentRecords.PendingPaymentTable(pendingPaymentData, destroyTable);
            pendingPaymentRecords.pageIndex = ItemsData.CurrentPage;
            functions.getCurrentUserActions();
        })
        .catch((err) => {
            console.log(err);
        });
};

pendingPaymentRecords.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", pendingPaymentRecords.getPendingPayment);
    pagination.activateCurrentPage();
};

pendingPaymentRecords.filterPaymentsLog = () => {
    let pageIndex = pendingPaymentRecords.pageIndex;
    let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
    let ViolationGeneralSearch = $("#violationSearch").val();
    let violationCategory = $("#violationCategory").val(); // Get violation category value

    // Check if at least one filter has a value
    if (
        ViolationTypeVal == "0" &&
        ViolationGeneralSearch == "" &&
        (!violationCategory || violationCategory === "") && // Check if violationCategory is empty
        $("#createdFrom").val() == "" &&
        $("#createdTo").val() == ""
    ) {
        functions.warningAlert(
            "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
        );
    } else {
        $(".PreLoader").addClass("active");
        let ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
        pendingPaymentRecords.getPendingPayment(
            pageIndex,
            true,
            ViolationType,
            ViolationGeneralSearch
        );
    }
};

pendingPaymentRecords.resetFilter = (e) => {
    e.preventDefault();
    $("#violationCategory").val("");
    $("#TypeofViolation").val("0");
    $("#violationSearch").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    pendingPaymentRecords.getPendingPayment();

    // Re-enable the TypeofViolation field after reset
    $("#TypeofViolation").prop("disabled", false);
};

pendingPaymentRecords.handleViolationCategoryChange = () => {
    $("#violationCategory").on("change", function () {
        const selectedCategory = $(this).val();
        const $typeOfViolationField = $("#TypeofViolation");

        // First, enable both fields
        $typeOfViolationField.prop("disabled", false);

        // Handle "Equipment" selection
        if (selectedCategory === "Equipment") {
            $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
        }

        // Handle "Vehicle" selection
        else if (selectedCategory === "Vehicle") {
            $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
        }
    });
};
const originalResetFilter = pendingPaymentRecords.resetFilter;
pendingPaymentRecords.resetFilter = function (e) {
    // Call the original resetFilter function
    originalResetFilter.call(this, e);

    // Re-enable both fields after reset
    $("#TypeofViolation").prop("disabled", false);
};

pendingPaymentRecords.PendingPaymentTable = (PendingPaymentData, destroyTable) => {
    let data = [];
    let taskViolation;

    if (PendingPaymentData.length > 0) {
        PendingPaymentData.forEach((record) => {
            taskViolation = record.Violation;
            let installmentDate = taskViolation?.InstallmentDate
                ? functions.getFormatedDate(taskViolation.InstallmentDate)
                : "-";

            if (taskViolation) {
                data.push([
                    `<div class="violationId" 
                          data-taskid="${record.ID}" 
                          data-violationid="${record?.ID}" 
                          data-taskstatus="${record?.Status}" 
                          data-offendertype="${taskViolation.OffenderType}" 
                          data-violationcode="${taskViolation.ViolationCode}" 
                          data-totalprice="${taskViolation?.TotalPriceDue}" 
                          data-actualpaid="${taskViolation?.ActualAmountPaid}" 
                          data-remainingamount="${taskViolation?.RemainingAmount}"
                          data-lawroyalty="${taskViolation?.LawRoyalty}"
                          data-totalequipmentsprice="${taskViolation?.TotalEquipmentsPrice}"
                          data-violationpricetype="${taskViolation?.ViolationTypes?.PriceType || ''}"
                          data-printedcount="${record?.PrintedCount || 0}"
                          data-totalinstallmentspaidamount="${taskViolation?.TotalInstallmentsPaidAmount || 0}"
                          >
                          ${taskViolation.ViolationCode || "-"}
                      </div>`,
                    `<div class='controls'>
                        <div class='ellipsisButton'>
                            <i class='fa-solid fa-ellipsis-vertical'></i>
                        </div>
                        <div class="hiddenListBox">
                            <div class='arrow'></div>
                            <ul class='list-unstyled controlsList'>
                                <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                                <li><a href="#" class="payInstallment">تسديد قسط</a></li>
                            </ul>
                        </div>
                    </div>`,
                    `<div class="violationArName">${functions.getViolationArabicName(
                        taskViolation.OffenderType
                    ) || "-"}</div>`,
                    `<div class="violatorName">${taskViolation.ViolatorName || '-'}</div>`,
                    `<div class="violationCode" data-offendertype="${taskViolation.OffenderType
                    }">${taskViolation.OffenderType == "Vehicle"
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
                    `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
                    `${installmentDate || "-"}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.TotalInstallmentsPaidAmount || 0) || "-"}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.RemainingAmount || 0) || "-"}`,
                ]);
            }
        });
    }

    if (pendingPaymentRecords.destroyTable || destroyTable) {
        $("#PendingPaymentRecords").DataTable().destroy();
    }

    let Table = functions.tableDeclare(
        "#PendingPaymentRecords",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "إسم المخالف" },
            { title: " رقم المحجر/العربة" },
            { title: "إسم الشركة المخالفة" },
            { title: "نوع المخالفة " },
            { title: "المنطقة" },
            { title: "تاريخ أخر قسط" },
            { title: "المبلغ المسدد" },
            { title: "المبلغ المتبقي" },
        ],
        false,
        false,
        "المخالفات قيد السداد.xlsx",
        "المخالفات قيد السداد"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'blue');

    pendingPaymentRecords.destroyTable = true;

    $(".ellipsisButton").on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    });

    let paymentLog = Table.rows().nodes().to$();
    let UserId = _spPageContextInfo.userId;

    functions.callSharePointListApi("Configurations").then((Users) => {
        let UserDetails;
        let UsersData = Users.value;
        UsersData.forEach((User) => {
            if (User.UserIdId.find((id) => id == UserId)) {
                UserDetails = User;
            }
        });

        $.each(paymentLog, (index, record) => {
            let jQueryRecord = $(record);
            let taskID = jQueryRecord.find(".violationId").data("taskid");
            let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

            if (
                paymentLog.length > 4 &&
                hiddenListBox.height() > 110 &&
                jQueryRecord.is(":nth-last-child(-n + 4)")
            ) {
                hiddenListBox.addClass("toTopDDL");
            }

            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".itemDetails")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    pendingPaymentRecords.findViolationByID(e, taskID, false);
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

pendingPaymentRecords.findViolationByID = (event, taskID, print = false) => {
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
            let violationOffenderType;
            let Content;
            let printBox;

            if (data != null) {
                violationData = data.d.Violation;
                violationOffenderType = violationData.OffenderType;

                if (violationOffenderType == "Quarry") {
                    Content = DetailsPopup.quarryDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                } else if (violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);

                    // Add the Vehicle Type handling
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                } else if (violationOffenderType == "Equipment") {
                    Content = DetailsPopup.equipmentDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                }

                // Add the print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                if (print) {
                    functions.PrintDetails(event);
                }

                // Add the class to identify this popup
                $(".detailsPopupForm").addClass("pendingPayment");
            } else {
                violationData = null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

export default pendingPaymentRecords;