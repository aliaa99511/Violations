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

    let UserId = _spPageContextInfo.userId;

    let request = {
        Data: {
            ...theCode,
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            Status: "UnderPayment",
            Sector: UserId,
            ViolationType: ViolationType,
            GlobalSearch: $("#violationSearch").val(),
            OffenderType: $("#violationCategory").val(),
            ViolatorName: $("#violatorName").val(),
            ViolatorCompany: $("#companyName").val(),
            ViolationCode: $("#violationCode").val(),
            ViolationsZone: $("#violationZone").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
    };
    $(".overlay").addClass("active");
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
            $(".overlay").removeClass("active");
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
        })
        .catch((err) => {
            $(".overlay").removeClass("active");
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

    const theCodeValue = $("#theCode").val();
    const violationCategoryValue = $("#violationCategory").val();
    const violationCode = $("#violationCode").val();
    const violationZone = $("#violationZone").val();
    const violatorName = $("#violatorName").val();
    const companyName = $("#companyName").val();
    const createdFrom = $("#createdFrom").val();
    const createdTo = $("#createdTo").val();

    if (
        theCodeValue &&
        theCodeValue.trim() !== "" &&
        (
            !violationCategoryValue ||
            violationCategoryValue === ""
        )
    ) {
        functions.warningAlert(
            "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة"
        );

        return;
    }

    if (

        (ViolationTypeVal == "" || ViolationTypeVal == "0") &&
        ViolationGeneralSearch == "" &&
        violationCode == "" &&
        violationZone == "" &&
        violatorName == "" &&
        companyName == "" &&
        theCodeValue == "" &&
        createdFrom == "" &&
        createdTo == ""
    ) {
        functions.warningAlert(
            "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
        );

        return;
    }

    $(".overlay").addClass("active");

    let ViolationType = Number(
        $("#TypeofViolation")
            .children("option:selected")
            .data("id")
    );

    pendingPaymentRecords.getPendingPayment(
        pageIndex,
        true,
        ViolationType,
        ViolationGeneralSearch
    );

};

pendingPaymentRecords.resetFilter = (e) => {
    e.preventDefault();
    $("#violationCategory").val("");
    $("#TypeofViolation").val("0");
    $("#violationSearch").val("");
    $("#violatorName").val("");
    $("#companyName").val("");
    $("#theCode").val("");
    $("#violationCode").val("");
    $("#violationZone").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    $(".overlay").addClass("active");
    pagination.reset();
    pendingPaymentRecords.getPendingPayment();

    // Re-enable fields after reset
    $("#theCode").prop("disabled", false);
    $("#TypeofViolation").prop("disabled", false);
};

pendingPaymentRecords.handleViolationCategoryChange = () => {
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

const originalResetFilter = pendingPaymentRecords.resetFilter;
pendingPaymentRecords.resetFilter = function (e) {
    // Call the original resetFilter function
    originalResetFilter.call(this, e);

    // Re-enable fields after reset
    $("#theCode").prop("disabled", false);
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

    // Update export button handler
    $("#exportBtn").off("click").on("click", () => {
        pendingPaymentRecords.exportToExcel();
    });

    // $(".ellipsisButton").on("click", (e) => {
    //     $(".hiddenListBox").hide(300);
    //     $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    // });

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

            // if (
            //     paymentLog.length > 4 &&
            //     hiddenListBox.height() > 110 &&
            //     jQueryRecord.is(":nth-last-child(-n + 4)")
            // ) {
            //     hiddenListBox.addClass("toTopDDL");
            // }

            // Toggle menu
            jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
                e.stopPropagation();
                const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
                $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
                currentBox.stop(true, true).toggle(300);
            });

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
pendingPaymentRecords.exportToExcel = () => {
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

    let UserId = _spPageContextInfo.userId;

    const currentFilters = {
        ...theCode,
        RowsPerPage: 10000000, // Get all records for export
        PageIndex: 1,
        ColName: "created",
        SortOrder: "desc",
        Status: "UnderPayment",
        Sector: UserId,
        ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
        GlobalSearch: $("#violationSearch").val(),
        OffenderType: $("#violationCategory").val(),
        ViolatorName: $("#violatorName").val(),
        ViolatorCompany: $("#companyName").val(),
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
            title: "إسم المخالف",
            data: "Violation.ViolatorName",
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
            title: "تاريخ أخر قسط",
            render: (record) => record.Violation?.InstallmentDate ? functions.getFormatedDate(record.Violation.InstallmentDate) : "-",
        },
        {
            title: "المبلغ المسدد",
            render: (record) => functions.splitBigNumbersByComma(record.Violation?.TotalInstallmentsPaidAmount || 0),
        },
        {
            title: "المبلغ المتبقي",
            render: (record) => functions.splitBigNumbersByComma(record.Violation?.RemainingAmount || 0),
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
        columns: columns,
        fileName: "المخالفات قيد السداد.xlsx",
        sheetName: "المخالفات قيد السداد",
        columnWidths: 25,
        rtl: true,
        dataPath: "d.Result.GridData",
        exportButtonSelector: "#exportBtn",
        tableSelector: "#PendingPaymentRecords"
    });
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

                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                if (print) {
                    functions.PrintDetails(event);
                }

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