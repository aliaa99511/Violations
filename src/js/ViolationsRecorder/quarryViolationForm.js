import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
// import { loadModules } from 'esri-loader';
// import Map from "@arcgis/core/Map.js";
// import MapView from "@arcgis/core/views/MapView.js";

let quarryViolation = {};

quarryViolation.violatorDetails = () => {
  let vaildViolator = false;
  let violatorDetails = {};
  let violatorNameCheck = functions.getNameInTriple("#violatorName");
  let violatorName = $("#violatorName").val();
  let violatorNationalId = $("#violatorNationalId").val();
  let violationGov = $("#violationGov").children("option:selected").val();
  let violationGovId = $("#violationGov")
    .children("option:selected")
    .data("id");
  let violationArea = $("#violationArea").children("option:selected").val();
  let violationAreaName = $("#violationArea")
    .children("option:selected")
    .data("areaname");
  let companyName = $("#companyName").val();
  let NationalIdRegExp =
    /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
  if (violatorNameCheck) {
    if (
      (violatorNationalId != "") &
      NationalIdRegExp.test(violatorNationalId)
    ) {
      if (violationGov != "") {
        if (violationArea != "") {
          if (companyName != "") {
            violatorDetails = {
              violatorName: violatorName,
              violatorNationalId: violatorNationalId,
              violationGov: violationGovId,
              violationAreaCode: violationArea,
              violationAreaName: violationAreaName,
              companyName: companyName,
            };
            vaildViolator = true;
          } else {
            functions.warningAlert(
              "من فضلك قم بادخال اسم الشركة التابع لها المخالف"
            );
          }
        } else {
          functions.warningAlert("من فضلك قم باختيار منطقة حدوث المخالفة");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم باختيار المحافظة الواقع بها المخالفة"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال الرقم القومي بشكل صحيح مكون من 14 رقم"
      );
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال اسم المخالف ثلاثي بشكل صحيح");
  }
  if (vaildViolator) {
    return violatorDetails;
  } else {
    return vaildViolator;
  }
};
quarryViolation.violationDetails = () => {
  let violationsData = {};
  let isBonesViolation = false;
  let BonesVisible = false;
  let validViolation = false;
  let violationType = $("#violationType").children("option:selected").val();
  let violationTypeId = $("#violationType")
    .children("option:selected")
    .data("id");
  let violationMaterail = $("#violationRawType")
    .children("option:selected")
    .val();
  let violationMaterailId = $("#violationRawType")
    .children("option:selected")
    .data("id");
  let violationDate = $("#violationDate").val();
  let violationTimeUnformatted = $("#violationTime").val();
  let violationTimeSplited = violationTimeUnformatted.split(":");
  let violationTime =
    violationTimeSplited[0] > 12
      ? violationTimeSplited[0] - 12 + ":" + violationTimeSplited[1] + " PM"
      : violationTimeSplited[0] + ":" + violationTimeSplited[1] + " AM";
  let quarryType = $("#quarryType").children("option:selected").val();
  let quarryCode = $("#quarryCode").val();
  let selectedEquipmentsIds = [];
  $(".toolsBox .tool").each((index, tool) => {
    let SelectInput = $(tool).find("input");
    let SelectedToolId;
    if ($(SelectInput).is(":checked")) {
      SelectedToolId = $(SelectInput).data("id");
      selectedEquipmentsIds.push(SelectedToolId);
    }
  });
  if (
    violationType == "اصدار بونات فارغة" ||
    violationType == "بيع بونات" ||
    violationType == "استخدام بونات الغير" ||
    violationType == "تلاعب ببيانات البونات"
  ) {
    isBonesViolation = true;
  } else {
    isBonesViolation = false;
  }

  if (violationType != "" && !isBonesViolation) {
    if (violationMaterail != "") {
      if (violationDate != "") {
        if (violationTimeUnformatted != "") {
          if (quarryType != "") {
            violationsData = {
              violationType: violationTypeId,
              violationMaterail: violationMaterailId,
              violationDate: violationDate + " " + violationTime,
              violationTime: violationDate + " " + violationTime,
              quarryType: quarryType,
              quarryCode: quarryCode != "" ? quarryCode : "",
              isBonesViolation: isBonesViolation,
              selectedEquipmentsIds:
                selectedEquipmentsIds.length > 0 ? selectedEquipmentsIds : [],
            };
            validViolation = true;
          } else {
            functions.warningAlert("من فضلك قم باختيار نوع المحجر");
          }
        } else {
          functions.warningAlert("من فضلك قم بتحديد وقت حدوث المخالفة");
        }
      } else {
        functions.warningAlert("من فضلك قم بتحديد تاريخ حدوث المخالفة");
      }
    } else {
      functions.warningAlert(
        "من فضلك قم باختيار نوع الخام المضبوط في المخالفة"
      );
    }
  } else if (
    violationType != "" &&
    isBonesViolation &&
    $(".BonesBox").is(":visible")
  ) {
    let BonesCount = Number($(".BonesCount").val());
    if (BonesCount != "") {
      if (violationMaterail != "") {
        if (violationDate != "") {
          if (violationTimeUnformatted != "") {
            if (quarryType != "") {
              violationsData = {
                violationType: violationTypeId,
                violationMaterail: violationMaterailId,
                violationDate: violationDate + " " + violationTime,
                violationTime: violationDate + " " + violationTime,
                quarryType: quarryType,
                quarryCode: quarryCode != "" ? quarryCode : "",
                BonsNumber: BonesCount,
                isBonesViolation: isBonesViolation,
                selectedEquipmentsIds:
                  selectedEquipmentsIds.length > 0 ? selectedEquipmentsIds : [],
              };
              validViolation = true;
            } else {
              functions.warningAlert("من فضلك قم باختيار نوع المحجر");
            }
          } else {
            functions.warningAlert("من فضلك قم بتحديد وقت حدوث المخالفة");
          }
        } else {
          functions.warningAlert("من فضلك قم بتحديد تاريخ حدوث المخالفة");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم باختيار نوع الخام المضبوط في المخالفة"
        );
      }
    } else {
      functions.warningAlert("من فضلك قم بادخال عدد البونات");
    }
  } else {
    functions.warningAlert("من فضلك قم باختيار نوع المخالفة");
  }
  if (validViolation) {
    return violationsData;
  } else {
    return validViolation;
  }
};
quarryViolation.violationDimensionsCoordsDetails = () => {
  let violationDimensionsData = {};
  let validDimensions = false;
  let violationDepth = $("#violationDepth").val();
  let violationAreaSpace = $("#AreaSpace").val();
  let distanceToNearQuarry = $("#distanceToNearQuarry").val();
  let coordsResponse = quarryViolation.GetCoordinates();
  let coordinates = quarryViolation.GetCoordinates().Decimal;
  let coordinatesDegrees = quarryViolation.GetCoordinates().Degree;
  let NumbersRegex =
    /(?:^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S)/;

  if (
    violationDepth != "" &&
    NumbersRegex.test(violationDepth) &&
    violationDepth != 0
  ) {
    if (
      violationAreaSpace != "" &&
      NumbersRegex.test(violationAreaSpace) &&
      violationAreaSpace != 0
    ) {
      if (
        distanceToNearQuarry != "" &&
        NumbersRegex.test(distanceToNearQuarry) &&
        distanceToNearQuarry != 0
      ) {
        if (coordsResponse != false) {
          // if(coordinates.length>=4){
          violationDimensionsData = {
            violationDepth: Number(violationDepth),
            violationAreaSpace: violationAreaSpace,
            distanceToNearQuarry: Number(distanceToNearQuarry),
            coordinates: coordinates,
            coordinatesDegrees: coordinatesDegrees,
          };
          validDimensions = true;
          // }else{
          //     functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
          // }
        } else {
          functions.warningAlert(
            "من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بادخال المسافة إلى أقرب محجر بشكل صحيح"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال مساحة المحجر الخاص بالمخالفة بشكل صحيح"
      );
    }
  } else {
    functions.warningAlert(
      "من فضلك قم بادخال عمق/ارتفاع المحجر الخاص بالمخالفة بشكل صحيح"
    );
  }

  if (validDimensions) {
    return violationDimensionsData;
  } else {
    return validDimensions;
  }
};
quarryViolation.otherViolationDetails = () => {
  let otherViolationDetails = {};
  let validOtherDetails = false;
  let violationDescription = $("#violationDescription").val();
  let violationLeaderOpinion = $("#sectorManegrOpinion").val();
  let committeeMember = sharedApis.checkCommitteeMember();
  let committeeMemberId = $(".committeeMember")
    .find(".committeeData")
    .children(".committeePersonName")
    .data("id");
  // let sectorId = $(".recorder").find(".committeeData").children(".committeePersonName").data("sectorid");
  // let attachecdFiles = $(".attachFilesInput")[0].files

  if (violationDescription != "") {
    if (violationLeaderOpinion != "") {
      if (committeeMember != false) {
        // if(attachecdFiles != null && attachecdFiles.length>0){
        otherViolationDetails = {
          violationDescription: violationDescription,
          violationLeaderOpinion: violationLeaderOpinion,
          committeeMemberId: committeeMemberId,
          // sectorId:sectorId,
        };
        validOtherDetails = true;
        // }else{
        //     functions.warningAlert("من فضلك قم بإرفاق المستندات الخاصة بالضبط")
        // }
      } else {
        functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة");
      }
    } else {
      functions.warningAlert("من فضلك قم بادخال رأي السيد قائد القطاع");
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال الوصف الخاص بالمخالفة");
  }

  if (validOtherDetails) {
    return otherViolationDetails;
  } else {
    return validOtherDetails;
  }
};
quarryViolation.formActions = () => {
  // let dateFun = new Date()
  // let today = dateFun.getDate()
  // let currentMonth = dateFun.getMonth() + 1
  // let currentYear = dateFun.getFullYear()
  // let last7Days = "0" + currentMonth + "/0" + (today - 7) + "/" + currentYear
  let numberOfDaysBefore = functions.getViolationStartDate(7);
  functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today");

  $("#violationType").on("change", (e) => {
    if (
      $(e.currentTarget).val() == "اصدار بونات فارغة" ||
      $(e.currentTarget).val() == "بيع بونات" ||
      $(e.currentTarget).val() == "استخدام بونات الغير" ||
      $(e.currentTarget).val() == "تلاعب ببيانات البونات"
    ) {
      $(".BonesBox").show();
    } else {
      $(".BonesBox").hide();
    }
  });

  $(".BonesCount").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".violatorNationalId").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".violationDepth").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".AreaSpace").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".distanceToNearQuarry").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });

  $(".coordinatesTable")
    .children("table")
    .find("input")
    .on("keypress", (e) => {
      return functions.isNumberKey(e);
    });

  $("#committeeMemberSelect").on("change", (e) => {
    $(".committeeMember")
      .find(".committeeData")
      .children(".committeePersonName,.committeePersonRank,.committeePersonJop")
      .remove();
    let memberData = sharedApis.checkCommitteeMember();
    if (memberData != false) {
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .children(".reSelectMember").before(`
                <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
                <p class="committeePersonRank">${memberData.CommitteeMemberRank}</p>
                <p class="committeePersonJop">${memberData.CommitteeMemberJopTitle}</p>
            `);
      $(e.currentTarget).parents(".committeeSearch").hide(200);
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .show(200);
    }
  });

  $(".reSelectMember").on("click", (e) => {
    $(e.currentTarget).parents(".committeeData").hide(200);
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .show(200);
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:selected")
      .removeAttr("selected");
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:first-child")
      .prop("selected", true);
  });

  $(".showOnMap").on("click", (e) => {
    let Coords = quarryViolation.GetCoordinates().Decimal;
    quarryViolation.drawCoordinates(Coords);
    $(e.currentTarget).text(
      $(e.currentTarget).text() == "عرض على الخريطة"
        ? "إخفاء الخريطة"
        : "عرض على الخريطة"
    );
  });

  $("#AddPoint").on("click", (e) => {
    quarryViolation.AddCoordinatePoint(e);
  });

  $("#submitQuarryViolation").on("click", (e) => {
    quarryViolation.validateForm(e);
  });
  $("#cancelQuarryViolation").on("click", (e) => {
    window.location.href =
      "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx";
  });
  let violationFiles;
  let countOfFiles;
  $(".dropFilesArea").hide();
  $(".attachFilesInput").on("change", (e) => {
    violationFiles = $(e.currentTarget)[0].files;
    if (violationFiles.length > 0) {
      // $(".dropFilesArea").show().empty()
      $(".dropFilesArea").show();
    }

    for (let i = 0; i < violationFiles.length; i++) {
      // let add=(arr, name)=> {
      //     let notExist = false;
      //     const { length } = arr;
      //     const id = length + 1;
      //     const found = arr.some(el => el.name === name);
      //     if (!found){
      //         notExist == true
      //     };
      //     return notExist;
      // }
      // console.log(add(violationFiles, violationFiles[i].name))
      // if (violationFiles.some(item => item.name === violationFiles[i].name)){
      //     console.log("exists")
      // }
      // else {
      //     console.log("not Exist")
      //     // $myData.push({input: input})
      // };
      console.log($(".attachFilesInput").val());
      $(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (e) => {
      let index = $(e.currentTarget).closest(".file").index();
      $(e.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < violationFiles.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(violationFiles[i]);
        }
      }
      violationFiles = fileBuffer.files;
      countOfFiles = violationFiles.length;
      if (countOfFiles == 0) {
        $(".dropFilesArea").hide();
      }
    });
    console.log(violationFiles);
  });

  let tableRows = $("#coordinatesTable tr:not(:first-child)");
  tableRows.each((index, row) => {
    let currentRow = $(row);
    let EastTds = currentRow.find("td:nth-child(2)");
    let NorthTds = currentRow.find("td:nth-child(3)");
    let E1 = EastTds.find("input:nth-child(1)");
    let E2 = EastTds.find("input:nth-child(2)");
    let E3 = EastTds.find("input:nth-child(3)");
    let N1 = NorthTds.find("input:nth-child(1)");
    let N2 = NorthTds.find("input:nth-child(2)");
    let N3 = NorthTds.find("input:nth-child(3)");
    $(E1).on("keyup", (e) => {
      if (Number($(e.currentTarget).val()) == 37) {
        $(E2).val(0);
        $(E2).attr("disabled", "disabled");
        $(E3).val(0);
        $(E3).attr("disabled", "disabled");
      } else if (
        $(e.currentTarget).val() == "" ||
        Number($(e.currentTarget).val()) != 37
      ) {
        $(E2).val("");
        $(E2).removeAttr("disabled");
        $(E3).val("");
        $(E3).removeAttr("disabled");
      }
    });
    $(N1).on("keyup", (e) => {
      if (Number($(e.currentTarget).val()) == 32) {
        $(N2).val(0);
        $(N2).attr("disabled", "disabled");
        $(N3).val(0);
        $(N3).attr("disabled", "disabled");
      } else if (
        $(e.currentTarget).val() == "" ||
        Number($(e.currentTarget).val()) != 32
      ) {
        $(N2).val("");
        $(N2).removeAttr("disabled");
        $(N3).val("");
        $(N3).removeAttr("disabled");
      }
    });
  });

  sharedApis.getGovernrates("#violationGov");
  sharedApis.getViolationZones("#violationArea");
  sharedApis.getViolationType("#violationType");
  sharedApis.getViolationMaterails("#violationRawType");
  sharedApis.getQuarryType("#quarryType");
  sharedApis.getEquipments(".quarryToolsBox");
  sharedApis.getCommitteeRecorder(
    ".committeeBox.recorder",
    ".committeeBox.sectorManager"
  );
  sharedApis.getCommitteeMember(".committeeMember");
  $(".PreLoader").removeClass("active");
};
quarryViolation.validateForm = (e) => {
  let UserId = _spPageContextInfo.userId;
  let ViolationData = {};
  let attachecdFiles = $(".attachFilesInput")[0].files;
  let otherViolationDetails = quarryViolation.otherViolationDetails();
  let violationsDimensions = quarryViolation.violationDimensionsCoordsDetails();
  let violationDetails = quarryViolation.violationDetails();
  let violatorDetails = quarryViolation.violatorDetails();
  if (violatorDetails != false) {
    if (violationDetails != false) {
      if (violationsDimensions != false) {
        if (attachecdFiles != null && attachecdFiles.length > 0) {
          if (otherViolationDetails != false) {
            functions.disableButton(e);
            ViolationData = {
              Title: "Test Adding New Quarry From Form",
              OffenderType: "Quarry",
              ViolatorName: violatorDetails.violatorName,
              NationalID: violatorDetails.violatorNationalId,
              Governrate: violatorDetails.violationGov,
              ViolationsZone: violatorDetails.violationAreaName,
              ViolatorCompany: violatorDetails.companyName,
              ViolationTime: violationDetails.violationTime,
              ViolationDate: violationDetails.violationDate,
              ViolationType: violationDetails.violationType,
              MaterialType: violationDetails.violationMaterail,
              QuarryType: violationDetails.quarryType,
              QuarryCode: violationDetails.quarryCode,
              BonsNumber: violationDetails.isBonesViolation
                ? violationDetails.BonsNumber
                : 0,
              Equipments: violationDetails.selectedEquipmentsIds,
              Depth: violationsDimensions.violationDepth,
              Area: violationsDimensions.violationAreaSpace,
              DistanceToNearestQuarry:
                violationsDimensions.distanceToNearQuarry,
              Coordinates: violationsDimensions.coordinates,
              CoordinatesDegrees: violationsDimensions.coordinatesDegrees,
              Description: otherViolationDetails.violationDescription,
              LeaderOpinion: otherViolationDetails.violationLeaderOpinion,
              CommiteeMember: otherViolationDetails.committeeMemberId,
              Sector: UserId,
            };
            quarryViolation.submitNewViolation(ViolationData);
          }
        } else {
          functions.warningAlert("من فضلك قم بإرفاق المستندات الخاصة بالضبط");
        }
      }
    }
  }
};
quarryViolation.submitNewViolation = (ViolationData) => {
  let request = {
    Data: ViolationData,
  };
  console.log(request);
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save",
      { request }
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      console.log(data);
      $(".overlay").addClass("active");
      if (data.d.Status) {
        let ViolationId = data.d.Result.Id;
        quarryViolation.uploadAttachment(ViolationId, "Violations");
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      console.log(err);
    });
};
quarryViolation.uploadAttachment = (NewViolationID, ListName) => {
  let Data = new FormData();
  Data.append("itemId", NewViolationID);
  Data.append("listName", ListName);
  for (let i = 0; i <= $("#attachViolationFiles")[0].files.length; i++) {
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
        "تم إضافة مخالفة محجر جديدة بنجاح",
        false,
        "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx"
      );
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
      console.log(err.responseText);
    },
  });
};

quarryViolation.GetCoordinates = () => {
  var Rows = $("#coordinatesTable tr:not(:first-child)");
  let PointsArr = "[";
  let DecimalsArr = "[";
  let NumbersArr = "[";
  let IsValid = true;
  let pattern = new RegExp(/^\d*\.?\d*$/);
  Rows.each((index, Row) => {
    let CurrentRow = $(Row);
    let Cells = CurrentRow.find("td");
    let EastTds = CurrentRow.find("td:nth-child(2)");
    let NorthTds = CurrentRow.find("td:nth-child(3)");
    let PointArr = [];
    let DecimalArr = [];
    let NumberArr = [];
    Cells.each((cellIndex, Cell) => {
      let CurrentCell = $(Cell);
      let firstTd = $(Cell)[0];
      let lastTd = $(Cell)[1];
      let firstEastInputVal = Number(EastTds.find("input:nth-child(1)").val());
      let secondEastInputVal = Number(EastTds.find("input:nth-child(2)").val());
      let thirdEastInputVal = Number(EastTds.find("input:nth-child(3)").val());
      // let firstEastInput = EastTds.find("input:nth-child(1)")
      let firstNorthInputVal = Number(
        NorthTds.find("input:nth-child(1)").val()
      );
      let secondNorthInputVal = Number(
        NorthTds.find("input:nth-child(2)").val()
      );
      let thirdNorthInputVal = Number(
        NorthTds.find("input:nth-child(3)").val()
      );
      // let firstNorthInput = NorthTds.find("input:nth-child(1)")
      let Fields = CurrentCell.find("input");
      let Temp = [];
      // console.log(CurrentCell.find("input:nth-child(1)"))
      if (CurrentCell.index() != 3) {
        Fields.each((index, Field) => {
          let CurrentField = $(Field);
          let Value = CurrentField.val().trim();
          if (
            Value != "" &&
            pattern.test(Value) &&
            37 >= firstEastInputVal &&
            firstEastInputVal >= 24 &&
            32 >= firstNorthInputVal &&
            firstNorthInputVal >= 22 &&
            60 >= secondEastInputVal &&
            60 >= thirdEastInputVal &&
            60 >= secondNorthInputVal &&
            60 >= thirdNorthInputVal
          ) {
            Temp.push(Value);
          } else {
            IsValid = false;
            return false;
          }
        });
        PointArr.push(Temp[0] + "° " + Temp[1] + "' " + Temp[2] + '"');
        NumberArr.push(Temp[0] + " " + Temp[1] + " " + Temp[2] + " ");
        DecimalArr.push(
          parseFloat(Temp[0]) +
            parseFloat(Temp[1]) / 60 +
            parseFloat(Temp[2]) / 3600
        );
      }
    });
    if (index == Rows.length - 1) {
      PointsArr += "[" + PointArr + "]";
      NumbersArr += "[" + NumberArr + "]";
      DecimalsArr += "[" + DecimalArr + "]";
    } else {
      PointsArr += "[" + PointArr + "],";
      NumbersArr += "[" + NumberArr + "],";
      DecimalsArr += "[" + DecimalArr + "],";
    }
  });
  PointsArr += "]";
  NumbersArr += "]";
  DecimalsArr += "]";
  if (IsValid) {
    return {
      Degree: PointsArr,
      Decimal: DecimalsArr,
      Numbers: NumbersArr,
    };
  } else {
    // functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
    return false;
  }
};
quarryViolation.AddCoordinatePoint = (e) => {
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
    quarryViolation.DeleteCoordinatePoint(e)
  );
  coordinatesTable.find("table").append(cloneRow);
  coordinatesTable.find("table tr:last-child").children().fadeIn();
  quarryViolation.OrderTableRow();
};
quarryViolation.DeleteCoordinatePoint = (e) => {
  var element = $(e.currentTarget);
  let RowsLength = $("#coordinatesTable table").find("tr").length;
  if (RowsLength - 1 > 4) {
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
          quarryViolation.OrderTableRow();
        });
      }
    });
  } else {
    Swal.fire("لا يمكنك حذف هذه النقطة لا بد من وجود أربع نقاط على الاقل.");
  }
};
quarryViolation.OrderTableRow = () => {
  var Rows = $("#coordinatesTable tr:not(:first-child)");
  Rows.each((index, Row) => {
    let CurrentRow = $(Row);
    let CurrentIndex = CurrentRow.index();
    CurrentRow.find("th").html(CurrentIndex);
  });
};
quarryViolation.drawCoordinates = (Coords) => {
  $(".ShowOnMapBox").toggle();
  // let dojoConfig = {
  //     // ... your stuff
  //     packages: [
  //       {'jquery': 'https://code.jquery.com/jquery-3.6.1.min.js'}
  //     ]
  // }
  // if($("#coordinatesMap").length > 0){
  //     require([
  //         "esri/Map",
  //         "esri/views/MapView",
  //         // "esri/Graphic",
  //         // "esri/Basemap",
  //         // "esri/layers/FeatureLayer",
  //         // "esri/layers/support/LabelClass",
  //         // "esri/core/watchUtils",
  //         // "esri/widgets/Home",
  //     ],(Map,MapView)=>{
  //         // let myMap = new Map({
  //         //     // basemap: "topo-vector",
  //         //     // basemap : new Basemap({
  //         //     //     portalItem: {
  //         //     //         id: "6eb69353f886481d9f148a9a6281961a", // the id for the base map with out labels
  //         //     //         portal: "https://www.arcgis.com"
  //         //     //     }
  //         //     // })
  //         // })

  //         // let view = new MapView({
  //         //     container: "coordinatesMap",
  //         //     map: myMap,
  //         //     zoom: 6,
  //         //     center: [30.82763671874111, 26.657277674210142],
  //         //     cursor: "pointer",
  //         // });
  //     })
  // }
};

export default quarryViolation;
