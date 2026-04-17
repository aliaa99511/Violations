import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
import Swal from "sweetalert2";

let externalViolationForm = {};

// ==================== VIOLATOR DETAILS ====================
externalViolationForm.violatorDetails = () => {
    let vaildViolator = false;
    let violatorDetails = {};
    let violatorName = $("#violatorName").val();
    let violatorNationalId = $("#violatorNationalId").val();
    let violatorMobileNumber = $("#violatorMobileNumber").val();
    let companyName = $("#companyName").val();
    let violationGov = $("#violationGov").children("option:selected").val();
    let violationGovId = $("#violationGov").children("option:selected").data("id");
    let violationsZone = $("#violationsZone").val();
    let assignedProsecution = $("#assignedProsecution").children("option:selected").val();

    if (violatorName && violatorName.trim() !== "") {
        if (violationGov && violationGov !== "") {
            if (assignedProsecution && assignedProsecution !== "") {

                //  Check National ID if provided
                if (violatorNationalId !== "") {
                    // Check if exactly 14 digits
                    if (!/^\d{14}$/.test(violatorNationalId)) {
                        functions.warningAlert(
                            "الرقم القومي يجب أن يتكون من 14 رقمًا بالضبط",
                            "#violatorNationalId"
                        );
                        return false;
                    }
                }

                violatorDetails = {
                    violatorName: violatorName.trim(),
                    violatorNationalId: violatorNationalId && violatorNationalId.trim() !== "" ? violatorNationalId.trim() : "",
                    violatorMobileNumber: violatorMobileNumber != "" ? violatorMobileNumber : "",
                    companyName: companyName && companyName.trim() !== "" ? companyName.trim() : "",
                    violationGov: violationGovId,
                    violationGovText: violationGov,
                    violationsZone: violationsZone && violationsZone.trim() !== "" ? violationsZone.trim() : "",
                    assignedProsecution: assignedProsecution,
                };
                vaildViolator = true;
            } else {
                functions.warningAlert("من فضلك قم باختيار النيابة المختصة", "#assignedProsecution");
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار المحافظة", "#violationGov");
        }
    } else {
        functions.warningAlert("من فضلك قم بادخال اسم المخالف", "#violatorName");
    }

    if (vaildViolator) {
        return violatorDetails;
    } else {
        return vaildViolator;
    }
};

// ==================== VIOLATION DETAILS ====================
externalViolationForm.violationDetails = () => {
    let violationsData = {};
    let validViolation = false;
    let offenderType = $("#offenderType").children("option:selected").val();
    let offenderTypeId = $("#offenderType").children("option:selected").data("id");
    let violationType = $("#violationType").children("option:selected").val();
    let violationTypeId = $("#violationType").children("option:selected").data("id");
    let violationTypeText = $("#violationType").children("option:selected").text();
    let violationDate = $("#violationDate").val();
    let caseNumber = $("#caseNumber").val();
    let bonesCount = $("#BonesCount").val();

    // Check if this is a bones-related violation
    let isBonesViolation = violationTypeText.includes("بون") || violationTypeText.includes("بونات");

    if (offenderType && offenderType !== "") {

        // For Vehicle and Equipment, skip violation type validation (it's disabled)
        if (offenderType === "Vehicle" || offenderType === "Equipment") {
            // Skip violation type validation for Vehicle and Equipment
            if (violationDate && violationDate !== "") {
                if (caseNumber && caseNumber.trim() !== "") {
                    violationsData = {
                        offenderType: offenderType,
                        offenderTypeText: offenderType,
                        offenderTypeId: offenderTypeId,
                        violationType: 0, // Set to 0 or null for Vehicle/Equipment
                        violationTypeText: "", // Empty string for Vehicle/Equipment
                        violationDate: violationDate,
                        caseNumber: caseNumber.trim(),
                        rawViolationDate: violationDate,
                        bonesCount: 0,
                        isBonesViolation: false
                    };
                    validViolation = true;
                } else {
                    functions.warningAlert("من فضلك قم بادخال رقم القضية", "#caseNumber");
                }
            } else {
                functions.warningAlert("من فضلك قم بتحديد تاريخ الضبط", "#violationDate");
            }
        } else {
            // Original validation for other types (Quarry, etc.)
            if (violationType && violationType !== "") {
                if (violationDate && violationDate !== "") {
                    if (caseNumber && caseNumber.trim() !== "") {

                        // Validate bones count if it's a bones violation and the box is visible
                        if (isBonesViolation && $(".BonesBox").is(":visible")) {
                            if (!bonesCount || bonesCount.trim() === "" || isNaN(bonesCount) || Number(bonesCount) <= 0) {
                                functions.warningAlert("من فضلك قم بادخال عدد البونات بشكل صحيح", "#BonesCount");
                                return false;
                            }
                        }

                        violationsData = {
                            offenderType: offenderType,
                            offenderTypeText: offenderType,
                            offenderTypeId: offenderTypeId,
                            violationType: violationTypeId,
                            violationTypeText: violationType,
                            violationDate: violationDate,
                            caseNumber: caseNumber.trim(),
                            rawViolationDate: violationDate,
                            bonesCount: isBonesViolation && $(".BonesBox").is(":visible") ? Number(bonesCount) : 0,
                            isBonesViolation: isBonesViolation
                        };
                        validViolation = true;
                    } else {
                        functions.warningAlert("من فضلك قم بادخال رقم القضية", "#caseNumber");
                    }
                } else {
                    functions.warningAlert("من فضلك قم بتحديد تاريخ الضبط", "#violationDate");
                }
            } else {
                functions.warningAlert("من فضلك قم باختيار نوع المخالفة", "#violationType");
            }
        }
    } else {
        functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة", "#offenderType");
    }

    if (validViolation) {
        return violationsData;
    } else {
        return validViolation;
    }
};

// ==================== DIMENSIONS AND COORDINATES ====================
externalViolationForm.violationDimensionsCoordsDetails = () => {
    let violationDimensionsData = {};
    let validDimensions = false;
    let violationDepth = $("#violationDepth").val();
    let violationAreaSpace = $("#AreaSpace").val();
    let violationQuantity = $("#totalAreaSpace").val();
    let distanceToNearQuarry = $("#distanceToNearQuarry").val();
    let NearestQuarryCode = $("#NearestQuarryNumber").val();
    let coordsResponse = externalViolationForm.GetCoordinates();

    if (coordsResponse != false) {
        let coordinates = coordsResponse.Decimal;
        let coordinatesDegrees = coordsResponse.Degree;

        if (violationDepth != "" && violationDepth != 0) {
            if (violationAreaSpace != "" && violationAreaSpace != 0) {
                if (NearestQuarryCode != "") {
                    violationDimensionsData = {
                        violationDepth: Number(violationDepth),
                        violationAreaSpace: Number(violationAreaSpace),
                        violationQuantity: Number(violationQuantity),
                        distanceToNearQuarry: Number(distanceToNearQuarry),
                        NearestQuarryCode: NearestQuarryCode,
                        coordinates: coordinates,
                        coordinatesDegrees: coordinatesDegrees,
                    };
                    validDimensions = true;
                } else {
                    functions.warningAlert(
                        "من فضلك قم بإدخال رقم المحجر الأقرب للمخالفة",
                        "#NearestQuarryNumber"
                    );
                }
            } else {
                functions.warningAlert(
                    "من فضلك قم بادخال مساحة منطقة المخالفة بشكل صحيح",
                    "#AreaSpace"
                );
            }
        } else {
            functions.warningAlert(
                "من فضلك قم بادخال عمق/ارتفاع المحجر الخاص بالمخالفة بشكل صحيح",
                "#violationDepth"
            );
        }
    } else {
        functions.warningAlert(
            "من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح (يجب إدخال 3 نقاط على الأقل)",
            "#coordinatesTable"
        );
    }

    if (validDimensions) {
        return violationDimensionsData;
    } else {
        return validDimensions;
    }
};

// ==================== COORDINATES FUNCTIONS ====================
externalViolationForm.GetCoordinates = () => {
    var Rows = $("#coordinatesTable tr:not(:first-child)");
    let PointsArr = "[";
    let DecimalsArr = "[";
    let NumbersArr = "[";
    let IsValid = true;
    let pattern = new RegExp(/^\d*\.?\d*$/);

    let validPointsCount = 0;
    let hasAnyValidPoint = false;

    Rows.each((index, Row) => {
        let CurrentRow = $(Row);
        let Cells = CurrentRow.find("td");
        let EastTds = CurrentRow.find("td:nth-child(2)");
        let NorthTds = CurrentRow.find("td:nth-child(3)");
        let PointArr = [];
        let DecimalArr = [];
        let NumberArr = [];

        // Check if this row has any non-empty inputs
        let hasData = false;
        Cells.each((cellIndex, Cell) => {
            if (cellIndex != 3) {
                $(Cell).find("input").each((index, Field) => {
                    if ($(Field).val().trim() !== "") {
                        hasData = true;
                    }
                });
            }
        });

        // Skip if row is empty
        if (!hasData) {
            return;
        }

        let rowValid = true;
        Cells.each((cellIndex, Cell) => {
            let CurrentCell = $(Cell);

            // Get values for validation
            let firstEastInputVal = Number(EastTds.find("input:nth-child(1)").val() || 0);
            let secondEastInputVal = Number(EastTds.find("input:nth-child(2)").val() || 0);
            let thirdEastInputVal = Number(EastTds.find("input:nth-child(3)").val() || 0);
            let firstNorthInputVal = Number(NorthTds.find("input:nth-child(1)").val() || 0);
            let secondNorthInputVal = Number(NorthTds.find("input:nth-child(2)").val() || 0);
            let thirdNorthInputVal = Number(NorthTds.find("input:nth-child(3)").val() || 0);

            let Fields = CurrentCell.find("input");

            if (cellIndex != 3) {
                let Temp = [];
                Fields.each((fieldIndex, Field) => {
                    let CurrentField = $(Field);
                    let Value = CurrentField.val().trim();

                    // Validate all rows
                    if (Value === "" || !pattern.test(Value) ||
                        (fieldIndex === 0 && (firstEastInputVal > 37 || firstEastInputVal < 24)) ||
                        (fieldIndex === 0 && (firstNorthInputVal > 32 || firstNorthInputVal < 22)) ||
                        (fieldIndex === 1 && (secondEastInputVal > 60 || secondNorthInputVal > 60)) ||
                        (fieldIndex === 2 && (thirdEastInputVal > 60 || thirdNorthInputVal > 60))) {
                        rowValid = false;
                        return false;
                    }
                    Temp.push(Value);
                });

                // Only add to arrays if we have all three values for this cell
                if (Temp.length === 3) {
                    PointArr.push(Temp[0] + "° " + Temp[1] + "' " + Temp[2] + '"');
                    NumberArr.push(Temp[0] + " " + Temp[1] + " " + Temp[2] + " ");
                    DecimalArr.push(
                        parseFloat(Temp[0]) +
                        parseFloat(Temp[1]) / 60 +
                        parseFloat(Temp[2]) / 3600
                    );
                }
            }
        });

        // Only count this row as valid if both East and North cells have data
        if (rowValid && PointArr.length === 2) {
            validPointsCount++;
            hasAnyValidPoint = true;

            if (index === Rows.length - 1) {
                PointsArr += "[" + PointArr + "]";
                NumbersArr += "[" + NumberArr + "]";
                DecimalsArr += "[" + DecimalArr + "]";
            } else {
                PointsArr += "[" + PointArr + "],";
                NumbersArr += "[" + NumberArr + "],";
                DecimalsArr += "[" + DecimalArr + "],";
            }
        }
    });

    PointsArr += "]";
    NumbersArr += "]";
    DecimalsArr += "]";

    // NEW: Require at least 1 valid point instead of exactly 3
    if (IsValid && hasAnyValidPoint) {
        return {
            Degree: PointsArr,
            Decimal: DecimalsArr,
            Numbers: NumbersArr,
        };
    } else {
        return false;
    }
};

externalViolationForm.AddCoordinatePoint = (e) => {
    let coordinatesTable = $("#coordinatesTable");

    let cloneRow = $("#coordinatesTable")
        .find("tr.hideRow")
        .clone(true)
        .removeClass("hideRow table-line");
    let ClonedTr = $(cloneRow);
    ClonedTr.children().hide();
    ClonedTr.find("td input").val("");
    ClonedTr.find("td:last-child").append(
        `<span class="deleteCoordinate"><i class="fas fa-trash-alt"></i></span>`
    );
    ClonedTr.find(".deleteCoordinate").on("click", (e) =>
        externalViolationForm.DeleteCoordinatePoint(e)
    );
    coordinatesTable.find("table").append(cloneRow);
    coordinatesTable.find("table tr:last-child").children().fadeIn();
    externalViolationForm.OrderTableRow();

    // Re-attach coordinate validation for new row
    externalViolationForm.attachCoordinateValidation();
};

externalViolationForm.DeleteCoordinatePoint = (e) => {
    var element = $(e.currentTarget);
    let RowsLength = $("#coordinatesTable table").find("tr").length - 1; // Subtract header row

    // UPDATED: Only prevent deletion if this would remove the LAST point
    // Previously it required keeping at least 3 points
    if (RowsLength > 1) {
        Swal.fire({
            icon: "warning",
            customClass: "sweetStyle",
            title: "هل انت متأكد؟",
            text: "تأكيد حذف الإحداثيات ؟",
            showCancelButton: true,
            cancelButtonText: "لا",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "نعم",
            heightAuto: true,
        }).then((result) => {
            if (result.value) {
                let CurrentRow = $(element).parents("tr");
                CurrentRow.children().fadeOut(300, () => {
                    CurrentRow.detach();
                    externalViolationForm.OrderTableRow();
                });
            }
        });
    } else {
        Swal.fire({
            icon: "warning",
            customClass: "sweetStyle",
            title: "لا يمكن الحذف",
            text: "يجب أن يكون هناك نقطة واحدة على الأقل للإحداثيات",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "موافق",
            heightAuto: true,
        });
    }
};

externalViolationForm.OrderTableRow = () => {
    var Rows = $("#coordinatesTable tr:not(:first-child)");
    Rows.each((index, Row) => {
        let CurrentRow = $(Row);
        let CurrentIndex = CurrentRow.index();
        CurrentRow.find("th").html(CurrentIndex);
    });
};

// Function to attach coordinate validation
externalViolationForm.attachCoordinateValidation = () => {
    // East coordinates validation (first column)
    $(document).off("keyup", ".coordinatesTable td:nth-child(2) input:nth-child(1)");
    $(document).on("keyup", ".coordinatesTable td:nth-child(2) input:nth-child(1)", function (e) {
        if (Number($(e.currentTarget).val()) == 37) {
            $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
            $(e.currentTarget).closest("td").find("input:nth-child(2)").attr("disabled", "disabled");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
            $(e.currentTarget).closest("td").find("input:nth-child(3)").attr("disabled", "disabled");
        } else if (
            $(e.currentTarget).val() == "" ||
            Number($(e.currentTarget).val()) != 37
        ) {
            $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
            $(e.currentTarget).closest("td").find("input:nth-child(2)").removeAttr("disabled");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").removeAttr("disabled");
        }
    });

    // North coordinates validation (second column)
    $(document).off("keyup", ".coordinatesTable td:nth-child(3) input:nth-child(1)");
    $(document).on("keyup", ".coordinatesTable td:nth-child(3) input:nth-child(1)", function (e) {
        if (Number($(e.currentTarget).val()) == 32) {
            $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
            $(e.currentTarget).closest("td").find("input:nth-child(2)").attr("disabled", "disabled");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
            $(e.currentTarget).closest("td").find("input:nth-child(3)").attr("disabled", "disabled");
        } else if (
            $(e.currentTarget).val() == "" ||
            Number($(e.currentTarget).val()) != 32
        ) {
            $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
            $(e.currentTarget).closest("td").find("input:nth-child(2)").removeAttr("disabled");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
            $(e.currentTarget).closest("td").find("input:nth-child(3)").removeAttr("disabled");
        }
    });
};

// ==================== FORM ACTIONS ====================
externalViolationForm.formActions = () => {
    let numberOfDaysBefore = functions.getViolationStartDate(3);

    // Use the same date formatting function as quarryViolation
    functions.inputDateFormat(
        ".inputDate",
        numberOfDaysBefore,
        "today",
        "dd/mm/yyyy"
    );

    // Initialize datepicker with day-month-year format
    $(".inputDate").datepicker({
        dateFormat: "dd-mm-yy",
        changeMonth: true,
        changeYear: true,
        yearRange: "-100:+0",
        onSelect: function (dateText) {
            let dateParts = dateText.split("-");
            if (dateParts.length === 3) {
                let day = dateParts[0].padStart(2, '0');
                let month = dateParts[1].padStart(2, '0');
                let year = dateParts[2];
                let formattedDate = `${day}-${month}-${year}`;
                $(this).val(formattedDate);
            }
            $(this).trigger('change');
        }
    });

    // Number validation for case number
    $(".caseNumber").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // National ID validation (numbers only)
    $(".violatorNationalId").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    $(".violatorMobileNumber").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Bones count validation
    $(".BonesCount").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Calculate total area space (quantity) for dimensions
    $(".AreaSpace").on("keyup", (e) => {
        let cubicAreaSpace = $(e.currentTarget).val() * $(".violationDepth").val();
        $(".totalAreaSpace").val(cubicAreaSpace.toFixed(3));
        if ($(e.currentTarget).val() == "" && $(".violationDepth").val() == "") {
            $(".totalAreaSpace").val("");
        }
    });

    $(".violationDepth").on("keyup", (e) => {
        let cubicAreaSpace = $(e.currentTarget).val() * $(".AreaSpace").val();
        $(".totalAreaSpace").val(cubicAreaSpace.toFixed(3));
        if ($(e.currentTarget).val() == "" && $(".AreaSpace").val() == "") {
            $(".totalAreaSpace").val("");
        }
    });

    // Number validation for distance input
    $(".distanceToNearQuarry").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Number validation for coordinate inputs
    $(".coordinatesTable")
        .children("table")
        .find("td")
        .children("input:nth-child(1)")
        .on("keypress", (e) => {
            return functions.isNumberKey(e);
        });
    $(".coordinatesTable")
        .children("table")
        .find("td")
        .children("input:nth-child(2)")
        .on("keypress", (e) => {
            return functions.isNumberKey(e);
        });
    $(".coordinatesTable")
        .children("table")
        .find("td")
        .children("input:nth-child(3)")
        .on("keypress", (e) => {
            return functions.isDecimalNumberKey(e);
        });

    // Attach coordinate validation
    externalViolationForm.attachCoordinateValidation();

    // Ensure violation type is disabled for external violations
    $("#violationType").prop("disabled", true);

    // Add violation type change handler for BonesBox (like quarryViolation)
    $("#violationType").on("change", (e) => {
        const selectedText = $(e.currentTarget).children("option:selected").text();
        // Check if violation type is related to bones/vouchers
        if (selectedText.includes("بون") || selectedText.includes("بونات")) {
            $(".BonesBox").show();
        } else {
            $(".BonesBox").hide();
            $(".BonesCount").val(""); // Clear value when hidden
        }
    });

    // Add Point button for coordinates
    $("#AddPoint").on("click", (e) => {
        externalViolationForm.AddCoordinatePoint(e);
    });

    // Add click handlers for new buttons
    $("#addCarSectionBtn").on("click", () => {
        externalViolationForm.addCarSection();
    });

    $("#addEquipmentSectionBtn").on("click", () => {
        externalViolationForm.addEquipmentSection();
    });

    // Delete section handlers (using event delegation)
    $(document).on("click", ".car-delete", function (e) {
        e.preventDefault();
        externalViolationForm.deleteCarSection();
    });

    $(document).on("click", ".equipment-delete", function (e) {
        e.preventDefault();
        externalViolationForm.deleteEquipmentSection();
    });

    // Form submission
    $("#submitExternalViolation").on("click", (e) => {
        externalViolationForm.validateForm(e);
    });

    // Cancel button
    $("#cancelExternalViolation").on("click", (e) => {
        window.location.href = "/ViolationsBranch/Pages/ExternalViolationLog.aspx";
    });

    // File upload handling
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

    let violationFiles;
    let countOfFiles;
    $(".attachViolationFiles").on("change", (e) => {
        violationFiles = $(e.currentTarget)[0].files;

        if (violationFiles.length > 0) {
            $(e.currentTarget)
                .parents(".fileBox")
                .siblings(".dropFilesArea")
                .show()
                .empty();
        }

        for (let i = 0; i < violationFiles.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            $(event.currentTarget).val("");
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < violationFiles.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(violationFiles[i]);
                }
            }
            violationFiles = fileBuffer.files;
            countOfFiles = violationFiles.length;

            if (countOfFiles == 0) {
                $(e.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
            }
        });
        for (let i = 0; i < violationFiles.length; i++) {
            let fileSplited = violationFiles[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert(
                    "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
                );
                $(e.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
                $(e.currentTarget).val("");
            }
        }
    });
};

// ==================== API CALLS ====================
externalViolationForm.getOffenderTypes = () => {
    return new Promise((resolve, reject) => {
        $("#offenderType").empty().append(`
            <option value="" disabled selected hidden>
                تصنيف المخالفة
            </option>
        `);

        sharedApis.getOffenderType("#offenderType")
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error("Error loading offender types:", error);
                reject(error);
            });
    });
};

externalViolationForm.getViolationTypes = () => {
    return new Promise((resolve, reject) => {
        $("#violationType").empty().append(`
            <option value="" disabled selected hidden>
                نوع المخالفة
            </option>
        `);

        // Check if getViolationType exists and returns a Promise
        if (sharedApis.getViolationType && typeof sharedApis.getViolationType === 'function') {
            const result = sharedApis.getViolationType("#violationType");

            // Check if the result is a Promise
            if (result && typeof result.then === 'function') {
                result
                    .then(() => {
                        // After loading all types, filter to only show "سرقة مواد محجرية"
                        externalViolationForm.filterViolationType();
                        resolve();
                    })
                    .catch((error) => {
                        console.error("Error loading violation types:", error);
                        reject(error);
                    });
            } else {
                // If it's not a Promise, assume it completed synchronously
                console.warn("getViolationType didn't return a Promise, assuming synchronous completion");
                externalViolationForm.filterViolationType();
                resolve();
            }
        } else {
            console.warn("getViolationType function not found in sharedApis");
            // Add the specific option manually
            $("#violationType").append(`<option value="سرقة مواد محجرية" data-id="1" selected>سرقة مواد محجرية</option>`);
            $("#violationType").prop("disabled", true);
            resolve();
        }
    });
};
// Filter violation type to only show "سرقة مواد محجرية" and disable it
externalViolationForm.filterViolationType = () => {
    const $violationType = $("#violationType");
    const $options = $violationType.find("option");
    let foundTargetOption = false;
    let targetValue = "";
    let targetDataId = "";
    let targetText = "";

    // Find the "سرقة مواد محجرية" option
    $options.each(function () {
        const text = $(this).text().trim();
        if (text === "سرقة مواد محجرية" || text.includes("سرقة مواد محجرية")) {
            targetValue = $(this).val();
            targetDataId = $(this).data("id");
            targetText = text;
            foundTargetOption = true;
            return false; // break the loop
        }
    });

    // Remove all options except the first placeholder
    $violationType.find("option:not(:first)").remove();

    if (foundTargetOption) {
        // Add back only the "سرقة مواد محجرية" option
        $violationType.append(`
            <option value="${targetValue}" data-id="${targetDataId}" selected>${targetText}</option>
        `);
    } else {
        // If not found, add it manually
        $violationType.append(`
            <option value="سرقة مواد محجرية" data-id="1" selected>سرقة مواد محجرية</option>
        `);
    }

    // Disable the dropdown
    $violationType.prop("disabled", true);
};
externalViolationForm.getProsecutions = () => {
    return new Promise((resolve, reject) => {
        if (sharedApis.getProsecutions && typeof sharedApis.getProsecutions === 'function') {
            const result = sharedApis.getProsecutions("#assignedProsecution");

            if (result && typeof result.then === 'function') {
                result
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        console.error("Error loading prosecutions:", error);
                        reject(error);
                    });
            } else {
                resolve();
            }
        } else {
            console.warn("getProsecutions function not found in sharedApis");
            resolve();
        }
    });
};

// ==================== FORM VALIDATION ====================
externalViolationForm.validateForm = (e) => {
    e.preventDefault();

    $(".customInput").removeClass("error");
    $(".selectBox select").removeClass("error");

    let violatorDetails = externalViolationForm.violatorDetails();
    let violationDetails = externalViolationForm.violationDetails();
    let violationsDimensions = externalViolationForm.violationDimensionsCoordsDetails();

    // If any of the main sections validation fails, stop form submission
    if (!violatorDetails || !violationDetails || !violationsDimensions) {
        return;
    }

    // Get dynamic sections data with validation
    let dynamicSectionsData = externalViolationForm.collectDynamicSectionsData();

    // If dynamic sections validation fails, stop form submission
    if (dynamicSectionsData === false) {
        return;
    }

    // Format the date to match quarryViolation (MM-DD-YYYY)
    const violationDateInput = $("#violationDate").val();
    // Split by either '/' or '-'
    const dateParts = violationDateInput.split(/[\/\-]/);

    if (dateParts.length === 3) {
        // Assuming the input is DD-MM-YYYY
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        // Format as MM-DD-YYYY for API (same as quarryViolation)
        const apiDate = `${month}-${day}-${year}`;

        let offenderType = $("#offenderType").children("option:selected").val();
        let offenderTypeId = $("#offenderType").children("option:selected").data("id");

        // Construct the complete ViolationData object
        const ViolationData = {
            // Basic violation information
            Title: "New External Violation",
            OffenderType: offenderTypeId || offenderType,
            IsExternalRecord: true,

            // Violator details
            ViolatorName: violatorDetails.violatorName,
            NationalID: violatorDetails.violatorNationalId || "",
            MobileNumber: violatorDetails.violatorMobileNumber,
            ViolatorCompany: violatorDetails.companyName || "",
            Governrate: violatorDetails.violationGov,
            ViolationsZone: violatorDetails.violationsZone || "",
            AssignedProsecution: violatorDetails.assignedProsecution,

            // Violation details
            ViolationType: violationDetails.violationType,
            CaseNumber: violationDetails.caseNumber,
            ViolationDate: apiDate,
            BonsNumber: violationDetails.isBonesViolation ? violationDetails.bonesCount : 0,

            // Dimensions data
            Depth: violationsDimensions.violationDepth,
            Area: violationsDimensions.violationAreaSpace,
            TotalQuantity: violationsDimensions.violationQuantity,
            DistanceToNearestQuarry: violationsDimensions.distanceToNearQuarry || 0,
            NearestQuarryCode: violationsDimensions.NearestQuarryCode,
            Coordinates: violationsDimensions.coordinates,
            CoordinatesDegrees: violationsDimensions.coordinatesDegrees,

            // Committee members (if applicable - add if your form has this)
            // CommiteeMember: "",
            // SectorMembers: "",
            // Sector: 0,
        };

        // Add dynamic car section data if it exists
        if (dynamicSectionsData.carData) {
            Object.assign(ViolationData, {
                NumOfPreviousViolations: dynamicSectionsData.carData.violationPrevCount || 0,
                CarNumber: dynamicSectionsData.carData.carNumber,
                CarColor: dynamicSectionsData.carData.carColor,
                VehicleBrand: dynamicSectionsData.carData.vehicleBrand,
                TrafficName: dynamicSectionsData.carData.carLicenseTraffic || "",
                DrivingLicense: dynamicSectionsData.carData.driverLicenseNumber || "",
                TrafficLicense: dynamicSectionsData.carData.driverLicenseTraffic || "",
                VehicleType: dynamicSectionsData.carData.vehicleType,
                TrailerNum: dynamicSectionsData.carData.trailerNum || "",
                // MaterialType: dynamicSectionsData.carData.materialType // Uncomment if you have material type
            });
        }

        // Add dynamic equipment data if it exists
        if (dynamicSectionsData.equipmentData && dynamicSectionsData.equipmentData.Equipments.length > 0) {
            Object.assign(ViolationData, {
                Equipments: dynamicSectionsData.equipmentData.Equipments,
                EquipmentsCount: dynamicSectionsData.equipmentData.EquipmentsCount
            });
        }

        // Optional: Add MaterialUnit if needed (like in quarryViolation with calculate by ton)
        // if ($("#calculateByTon").is(":checked")) {
        //     ViolationData.MaterialUnit = "طن";
        // }

        // Disable the submit button to prevent double submission
        functions.disableButton(e);

        // Submit the violation
        externalViolationForm.submitNewViolation(e, ViolationData);

    } else {
        functions.warningAlert("تاريخ غير صحيح. استخدم الصيغة DD/MM/YYYY", "#violationDate");
    }
};

// ==================== SUBMIT VIOLATION ====================
externalViolationForm.submitNewViolation = (e, ViolationData) => {
    // Show loading overlay
    $(".overlay").addClass("active");

    const request = {
        request: {
            Data: ViolationData
        }
    };

    functions.requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save",
        request
    )
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            if (data?.d?.Status) {
                const ViolationId = data.d.Result.Id;
                const files = $("#attachViolationFiles")[0].files;

                // Check if there are files to upload
                if (files?.length > 0) {
                    // Keep overlay active while uploading attachments
                    externalViolationForm.uploadAttachment(ViolationId, "Violations");
                } else {
                    $(".overlay").removeClass("active");
                    functions.sucessAlert(
                        "تم إضافة مخالفة خارجية جديدة بنجاح",
                        false,
                        "/ViolationsBranch/Pages/ExternalViolationLog.aspx"
                    );
                }
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert(data?.d?.Message || "حدث خطأ أثناء الحفظ");
            }
        })
        .catch(err => {
            $(".overlay").removeClass("active");
            console.error(err);
            functions.warningAlert("خطأ في إرسال البيانات: " + err.message);
        });
};

// ==================== UPLOAD ATTACHMENTS ====================
externalViolationForm.uploadAttachment = (NewViolationID, ListName) => {
    $(".overlay").addClass("active");
    let Data = new FormData();
    Data.append("itemId", NewViolationID);
    Data.append("listName", ListName);
    Data.append("Method", "New");

    let count = 0;
    let i;
    for (i = 0; i < $("#attachViolationFiles")[0].files.length; i++) {
        Data.append("file" + i, $("#attachViolationFiles")[0].files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(
                "تم إضافة مخالفة خارجية جديدة بنجاح",
                false,
                "/ViolationsBranch/Pages/ExternalViolationLog.aspx"
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
            console.log(err.responseText);
        },
    });
};

// ==================== INITIALIZATION ====================
externalViolationForm.init = () => {
    $(document).ready(function () {
        externalViolationForm.formActions();
        $(".PreLoader").addClass("active");

        // Add the offender type change handler
        externalViolationForm.handleOffenderTypeChange();

        // Load all dropdowns in correct order
        Promise.all([
            sharedApis.getGovernrates("#violationGov"),
            sharedApis.getOffenderType("#offenderType"),
            externalViolationForm.getViolationTypes(), // This will now filter and disable
            externalViolationForm.getProsecutions()
        ])
            .then(() => {
                $(".PreLoader").removeClass("active");
                // Ensure violation type stays disabled
                $("#violationType").prop("disabled", true);
            })
            .catch((error) => {
                $(".PreLoader").removeClass("active");
                console.error("Error loading dropdowns:", error);
            });
    });
};
// ==================== DYNAMIC SECTIONS ====================
externalViolationForm.carSectionExists = false;
externalViolationForm.equipmentSectionExists = false;

// Initialize car section functionality
externalViolationForm.initializeCarSection = () => {
    // Car type change handler - initially hide tractor box
    $(".tractorBox_dynamic").hide();

    $("#violationCarType_dynamic").off("change").on("change", function () {
        if ($(this).val() === "عربة بمقطورة") {
            $(".tractorBox_dynamic").show();
        } else {
            $(".tractorBox_dynamic").hide();
            // Clear tractor fields when hiding
            $("#tractorLetters_dynamic, #tractorNumbers_dynamic").val("");
        }
    });

    // Unmarked checkbox functionality
    $("#unmarkedCheckbox_dynamic").off("change").on("change", function () {
        if ($(this).is(":checked")) {
            $("#carLicenseLetters_dynamic, #carLicenseNumbers_dynamic, #tractorLetters_dynamic, #tractorNumbers_dynamic").prop("disabled", true).val("");
            $(".previous-violations-display").fadeOut();
            $(".previous-violations-count-value").text("0");
        } else {
            $("#carLicenseLetters_dynamic, #carLicenseNumbers_dynamic, #tractorLetters_dynamic, #tractorNumbers_dynamic").prop("disabled", false);
        }
    });

    // Number validation for tractor numbers
    $("#tractorNumbers_dynamic").off("keypress").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Number validation for car license numbers
    $("#carLicenseNumbers_dynamic").off("keypress").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Number validation for driver license
    $("#driverLicenseNumber_dynamic").off("keypress").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    $("#carLicenseLetters_dynamic").on("keypress", (e) => {
        if (e.currentTarget.value.length > 0) {
            let charCode = e.currentTarget.value.charCodeAt(e.currentTarget.value.length - 1)
            if (charCode >= 1569 && charCode <= 1610) {
                e.currentTarget.value += " ";
            }
        }
        return functions.isArabicLetter(e)
    })
    $("#tractorLetters_dynamic").on("keypress", (e) => {
        if (e.currentTarget.value.length > 0) {
            let charCode = e.currentTarget.value.charCodeAt(e.currentTarget.value.length - 1)
            if (charCode >= 1569 && charCode <= 1610) {
                e.currentTarget.value += " ";
            }
        }
        return functions.isArabicLetter(e)
    })

    // Get previous violations count
    const debouncedGetCount = functions.debounce(function () {
        if ($("#unmarkedCheckbox_dynamic").is(":checked")) {
            return;
        }

        let letters = $("#carLicenseLetters_dynamic").val();
        let numbers = $("#carLicenseNumbers_dynamic").val();
        if (letters && letters.trim() !== "" && numbers && numbers.trim() !== "") {
            externalViolationForm.getPreviousViolationsCount();
        }
    }, 500);

    $("#carLicenseLetters_dynamic, #carLicenseNumbers_dynamic").off("change keyup").on("change keyup", debouncedGetCount);

    // Blur event for previous violations
    $("#carLicenseLetters_dynamic, #carLicenseNumbers_dynamic").off("blur").on("blur", function () {
        if ($("#unmarkedCheckbox_dynamic").is(":checked")) {
            return;
        }

        let letters = $("#carLicenseLetters_dynamic").val();
        let numbers = $("#carLicenseNumbers_dynamic").val();
        if (letters && letters.trim() !== "" && numbers && numbers.trim() !== "") {
            externalViolationForm.getPreviousViolationsCount();
        }
    });
};

// Get previous violations count
externalViolationForm.getPreviousViolationsCount = () => {
    let carLicenseLetters = $("#carLicenseLetters_dynamic").val();
    let carLicenseNumbers = $("#carLicenseNumbers_dynamic").val();

    if ($("#unmarkedCheckbox_dynamic").is(":checked")) {
        $(".previous-violations-display").fadeOut();
        $(".previous-violations-count-value").text("0");
        return;
    }

    let carNumber = "";
    if (carLicenseLetters && carLicenseLetters.trim() !== "" &&
        carLicenseNumbers && carLicenseNumbers.trim() !== "") {
        carNumber = (carLicenseLetters + " " + carLicenseNumbers).trim();
    }

    if (!carNumber || carNumber.trim() === "") {
        $(".previous-violations-display").fadeOut();
        $(".previous-violations-count-value").text("0");
        return;
    }

    let requestData = {
        request: {
            Data: {
                OffenderType: "Vehicle",
                CarNumber: carNumber.trim()
            }
        }
    };

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/GetPreviousViolationsCount",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(requestData),
        success: (response) => {
            if (response.d && response.d.Status) {
                let count = response.d.Result;
                $(".previous-violations-count-value").text(count);
                $(".previous-violations-display").fadeIn();
            } else {
                $(".previous-violations-display").fadeOut();
                $(".previous-violations-count-value").text("0");
            }
        },
        error: (xhr) => {
            console.log("Error fetching previous violations count:", xhr.responseText);
            $(".previous-violations-display").fadeOut();
            $(".previous-violations-count-value").text("0");
        }
    });
};

// Validate car section data
externalViolationForm.validateCarSection = () => {
    let carData = {};
    let isValid = false;

    let carLicenseLetters = $("#carLicenseLetters_dynamic").val();
    let carLicenseNumbers = $("#carLicenseNumbers_dynamic").val();
    let carLicenceColor = $("#carLicenseColor_dynamic").val();
    let carBrand = $("#carBrand_dynamic").val();
    let carType = $("#violationCarType_dynamic").val();
    let violationPrevCount = $(".previous-violations-count-value").text();
    let unmarkedChecked = $("#unmarkedCheckbox_dynamic").is(":checked");

    let tractorLetters = $("#tractorLetters_dynamic").val();
    let tractorNumbers = $("#tractorNumbers_dynamic").val();
    // Validate based on car type
    if (carType === "عربة بمقطورة") {

        if (!unmarkedChecked) {
            if (!tractorLetters || tractorLetters.trim() === "") {
                functions.warningAlert("من فضلك قم بادخال حروف المقطورة");
                return false;
            }
            if (!tractorNumbers || tractorNumbers.trim() === "") {
                functions.warningAlert("من فضلك قم بادخال أرقام المقطورة");
                return false;
            }
            carData.trailerNum = (tractorLetters + " " + tractorNumbers).trim();
        } else {
            carData.trailerNum = "بدون لوحات";
        }
    }

    // Validate common fields
    if (!unmarkedChecked) {
        if (!carLicenseLetters || carLicenseLetters.trim() === "") {
            functions.warningAlert("من فضلك قم بادخال حروف العربة");
            return false;
        }
        if (!carLicenseNumbers || carLicenseNumbers.trim() === "") {
            functions.warningAlert("من فضلك قم بادخال أرقام العربة");
            return false;
        }
    }

    if (!carLicenceColor || carLicenceColor.trim() === "") {
        functions.warningAlert("من فضلك قم بادخال لون العربة");
        return false;
    }
    if (!carBrand || carBrand.trim() === "") {
        functions.warningAlert("من فضلك قم بادخال نوع العربة");
        return false;
    }
    if (!carType) {
        functions.warningAlert("من فضلك قم باختيار نوع العربة");
        return false;
    }
    // if (!violationPrevCount || violationPrevCount === "0") {
    //     functions.warningAlert("من فضلك قم بالتأكد من ظهور عدد المخالفات السابقة");
    //     return false;
    // }

    // Build car data object
    carData = {
        carNumber: unmarkedChecked ? "بدون لوحات" : (carLicenseLetters + " " + carLicenseNumbers).trim(),
        carColor: carLicenceColor,
        vehicleBrand: carBrand,
        carLicenseTraffic: $("#carLicenseTraffic_dynamic").val() || "",
        driverLicenseNumber: $("#driverLicenseNumber_dynamic").val() || "",
        driverLicenseTraffic: $("#driverLicenseTraffic_dynamic").val() || "",
        vehicleType: carType,
        trailerNum: carType === "عربة بمقطورة"
            ? (tractorLetters + " " + tractorNumbers).trim()
            : "",
        violationPrevCount: Number(violationPrevCount)
    };

    return carData;
};

// Add car section (only one)
externalViolationForm.addCarSection = () => {
    // Check for visible car sections only
    if ($(".car-section").filter(":visible").length > 0) {
        Swal.fire({
            icon: "warning",
            customClass: "sweetStyle",
            title: "لا يمكن إضافة المزيد",
            text: "يمكن إضافة عربة واحدة فقط",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "موافق",
            heightAuto: true,
        });
        return;
    }

    const container = $("#carSectionsContainer");
    const newSection = externalViolationForm.getCarSectionTemplate();
    container.append(newSection);

    externalViolationForm.carSectionExists = true;

    // Hide the add car button
    $("#addCarSectionBtn").hide();

    // Initialize all dropdowns and functionality for the car section
    externalViolationForm.initializeCarSection();

    // Scroll to the new section
    $('html, body').animate({
        scrollTop: $("#carSectionsContainer").offset().top - 100
    }, 500);
};

// Add equipment section (only one)
externalViolationForm.addEquipmentSection = () => {
    // Check for visible equipment sections only
    if ($(".equipment-section").filter(":visible").length > 0) {
        Swal.fire({
            icon: "warning",
            customClass: "sweetStyle",
            title: "لا يمكن إضافة المزيد",
            text: "يمكن إضافة قسم معدات واحد فقط",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "موافق",
            heightAuto: true,
        });
        return;
    }

    const container = $("#equipmentSectionsContainer");
    const newSection = externalViolationForm.getEquipmentSectionTemplate();
    container.append(newSection);

    externalViolationForm.equipmentSectionExists = true;

    // Hide the add equipment button
    $("#addEquipmentSectionBtn").hide();

    // Initialize equipment dropdown
    setTimeout(() => {
        sharedApis.getEquipments("#equipmentToolsBox_dynamic");
    }, 100);

    // Scroll to the new section
    $('html, body').animate({
        scrollTop: $("#equipmentSectionsContainer").offset().top - 100
    }, 500);
};
// Delete car section
externalViolationForm.deleteCarSection = () => {
    Swal.fire({
        icon: "warning",
        customClass: "sweetStyle",
        title: "هل انت متأكد؟",
        text: "تأكيد حذف قسم العربة ؟",
        showCancelButton: true,
        cancelButtonText: "لا",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "نعم",
        heightAuto: true,
    }).then((result) => {
        if (result.value) {
            // Only remove visible car sections
            $(".car-section").filter(":visible").fadeOut(300, function () {
                $(this).remove();
                externalViolationForm.carSectionExists = false;
                $("#addCarSectionBtn").show();
            });
        }
    });
};

// Delete equipment section
externalViolationForm.deleteEquipmentSection = () => {
    Swal.fire({
        icon: "warning",
        customClass: "sweetStyle",
        title: "هل انت متأكد؟",
        text: "تأكيد حذف قسم المعدات ؟",
        showCancelButton: true,
        cancelButtonText: "لا",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "نعم",
        heightAuto: true,
    }).then((result) => {
        if (result.value) {
            // Only remove visible equipment sections
            $(".equipment-section").filter(":visible").fadeOut(300, function () {
                $(this).remove();
                externalViolationForm.equipmentSectionExists = false;
                $("#addEquipmentSectionBtn").show();
            });
        }
    });
};

// Collect data from dynamic sections (for form submission)
externalViolationForm.collectDynamicSectionsData = () => {
    const data = {
        carData: null,
        equipmentData: {
            Equipments: [],
            EquipmentsCount: []
        }
    };

    // Collect car section data if exists and is visible (not the hidden template)
    // Check for visible car sections only
    if ($(".car-section").filter(":visible").length > 0) {
        data.carData = externalViolationForm.validateCarSection();

        // If validation fails, return false to stop form submission
        if (!data.carData) {
            return false;
        }
    }

    // Collect equipment data if exists and is visible (not the hidden template)
    if ($(".equipment-section").filter(":visible").length > 0) {
        $("#equipmentToolsBox_dynamic .tool").each(function () {
            const checkbox = $(this).find("input[type='checkbox']");
            const count = $(this).find(".toolCount").val();

            if (checkbox.is(":checked") && count && count > 0) {
                data.equipmentData.Equipments.push(checkbox.data("id"));
                data.equipmentData.EquipmentsCount.push({
                    id: checkbox.data("id"),
                    count: Number(count)
                });
            }
        });
    }

    return data;
};
externalViolationForm.getCarSectionTemplate = () => {
    return $('#carSectionTemplate').children().first().clone(true, true);
};
externalViolationForm.getEquipmentSectionTemplate = () => {
    return $('#equipmentSectionTemplate').children().first().clone(true, true);
};

externalViolationForm.handleOffenderTypeChange = () => {
    $("#offenderType").on("change", function () {
        const selectedType = $(this).val();
        const $violationTypeField = $("#violationType");
        const $bonesBox = $(".BonesBox");

        // For external violations, the violation type is always "سرقة مواد محجرية" and disabled
        // Only handle bones box visibility based on violation type text
        const selectedText = $violationTypeField.find("option:selected").text();

        if (selectedText.includes("بون") || selectedText.includes("بونات")) {
            $bonesBox.show();
        } else {
            $bonesBox.hide();
            $(".BonesCount").val("");
        }

        // Keep violation type disabled regardless of offender type
        $violationTypeField.prop("disabled", true);
    });

    // Set initial state - ensure violation type is disabled on page load
    setTimeout(() => {
        $("#violationType").prop("disabled", true);
    }, 100);
};

export default externalViolationForm;