import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
// import { loadModules } from 'esri-loader';
// import Map from "@arcgis/core/Map.js";
// import MapView from "@arcgis/core/views/MapView.js";

let quarryViolation = {};
var urlParams = new URLSearchParams(window.location.search);
var editViolationId;

quarryViolation.violatorDetails = () => {
  let vaildViolator = false;
  let violatorDetails = {};
  let violatorNameCheck = functions.getNameInTriple("#violatorName");
  let violatorName = $("#violatorName").val();
  let violatorNationalId = $("#violatorNationalId").val();
  let violatorMobileNumber = $("#violatorMobileNumber").val();

  // Get the previous violations count from the display span instead of input
  let violationPrevCount = $(".previous-violations-count-value").text();

  let violationGov = $("#violationGov").children("option:selected").val();
  let violationGovId = $("#violationGov")
    .children("option:selected")
    .data("id");
  let violationArea = $("#violationArea").val();
  let companyName = $("#companyName").val();
  let commercialRegister = $("#commercialRegister").val();

  if (violatorNameCheck) {
    // Check if previous violations count is not empty and is a valid number
    if (violationPrevCount !== "" && !isNaN(violationPrevCount)) {
      if (violationGov != "") {
        if (violationArea != "") {

          // Check National ID if provided
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
            violatorName: violatorName,
            violatorNationalId: violatorNationalId != "" ? violatorNationalId : "",
            violatorMobileNumber: violatorMobileNumber != "" ? violatorMobileNumber : "",
            violationPrevCount: Number(violationPrevCount),
            companyName: companyName != "" ? companyName : "",
            commercialRegister: commercialRegister != "" ? commercialRegister : "",
            violationAreaName: violationArea,
            violationGov: violationGovId,
          };
          vaildViolator = true;
        } else {
          functions.warningAlert(
            "من فضلك قم بادخال منطقة ضبط المخالفة",
            "#violationArea"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم باختيار المحافظة الواقع بها المخالفة",
          "#violationGov"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بالتأكد من ظهور عدد المخالفات السابقة",
        ".previous-violations-display"
      );
    }
  } else {
    functions.warningAlert(
      "من فضلك قم بادخال اسم المخالف ثلاثي بشكل صحيح",
      "#violatorName"
    );
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
  let violationMaterail = $("#quarryViolationRawType")
    .children("option:selected")
    .val();
  let violationMaterailId = $("#quarryViolationRawType")
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
  let selectedEquipementsIds = [];
  let selectedEquipmentsData = [];
  let EquipmentsData = {};
  $(".toolsBox .tool").each((index, tool) => {
    let SelectInput = $(tool).find("input");
    let toolCount = $(tool).find(".toolCount");
    let SelectedToolId;
    let toolCountVal;
    if ($(SelectInput).is(":checked")) {
      SelectedToolId = $(SelectInput).data("id");
      toolCountVal = $(toolCount).val();
      EquipmentsData = {
        id: SelectedToolId,
        count: Number(toolCountVal),
      };
      selectedEquipementsIds.push(SelectedToolId);
      selectedEquipmentsData.push(EquipmentsData);
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
            if (quarryCode != "") {
              // if (selectedEquipmentsData.length > 0) {
              violationsData = {
                violationType: violationTypeId,
                violationMaterail: violationMaterailId,
                violationDate: violationDate + " " + violationTime,
                violationTime: violationDate + " " + violationTime,
                quarryType: quarryType,
                quarryCode: quarryCode,
                isBonesViolation: isBonesViolation,
                selectedEquipmentsData: selectedEquipmentsData,
                selectedEquipementsIds: selectedEquipementsIds,
              };
              validViolation = true;
              // } else {
              //     functions.warningAlert("من فضلك قم بتحديد المعدات التي تم ضبطها", ".toolsBox")
              // }
            } else {
              functions.warningAlert(
                "من فضلك قم بادخال رقم المحجر",
                "#quarryCode"
              );
            }
          } else {
            functions.warningAlert(
              "من فضلك قم باختيار نوع المحجر",
              "#quarryType"
            );
          }
        } else {
          functions.warningAlert(
            "من فضلك قم بتحديد وقت حدوث المخالفة",
            "#violationTime"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بتحديد تاريخ حدوث المخالفة",
          "#violationDate"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم باختيار نوع الخام المضبوط في المخالفة",
        "#quarryViolationRawType"
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
              if (quarryCode != "") {
                // if (selectedEquipmentsData.length > 0) {
                violationsData = {
                  violationType: violationTypeId,
                  violationMaterail: violationMaterailId,
                  violationDate: violationDate + " " + violationTime,
                  violationTime: violationDate + " " + violationTime,
                  quarryType: quarryType,
                  quarryCode: quarryCode,
                  BonsNumber: BonesCount,
                  isBonesViolation: isBonesViolation,
                  selectedEquipmentsData: selectedEquipmentsData,
                  selectedEquipementsIds: selectedEquipementsIds,
                };
                validViolation = true;
                // } else {
                //     functions.warningAlert("من فضلك قم باختيار المعدات التي تم ضبطها", ".toolsBox")
                // }
              } else {
                functions.warningAlert(
                  "من فضلك قم بادخال رقم المحجر",
                  "#quarryCode"
                );
              }
            } else {
              functions.warningAlert(
                "من فضلك قم باختيار نوع المحجر",
                "#quarryType"
              );
            }
          } else {
            functions.warningAlert(
              "من فضلك قم بتحديد وقت حدوث المخالفة",
              "#violationTime"
            );
          }
        } else {
          functions.warningAlert(
            "من فضلك قم بتحديد تاريخ حدوث المخالفة",
            "#violationDate"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم باختيار نوع الخام المضبوط في المخالفة",
          "#quarryViolationRawType"
        );
      }
    } else {
      functions.warningAlert("من فضلك قم بادخال عدد البونات", ".BonesCount");
    }
  } else {
    functions.warningAlert("من فضلك قم باختيار نوع المخالفة", "#violationType");
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
  let violationQuantity = $("#totalAreaSpace").val();
  let distanceToNearQuarry = $("#distanceToNearQuarry").val();
  let NearestQuarryCode = $("#NearestQuarryNumber").val();
  let coordsResponse = quarryViolation.GetCoordinates(); // Call once

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
// quarryViolation.otherViolationDetails = () => {
//     let otherViolationDetails = {};
//     let validOtherDetails = false;
//     let violationDescription = $("#violationDescription").val();
//     let violationLeaderOpinion = $("#sectorManegrOpinion").val();
//     let member = $("#committeeMember").val();
//     console.log('committeeMember', $("#committeeMember"))
//     console.log('committeeMemberval', member)
//     //////////////////////////////////////////////////////////
//     // let committeeMember = sharedApis.checkCommitteeMember()
//     // let selectedMembersIds = [];
//     // let membersNames = $(".committeeMember").find(".membersDataBox").find(".memberData").children(".committeePersonName")
//     // let committeeMemberId;
//     // membersNames.each((index, memberName) => {
//     //     committeeMemberId = Number($(memberName).data("id"))
//     //     selectedMembersIds.push(committeeMemberId)
//     //     console.log("member ID", committeeMemberId)
//     //     console.log("all members IDs", selectedMembersIds)
//     // })
//     //////////////////////////////////////////////////////////

//     // let sectorId = $(".recorder").find(".committeeData").children(".committeePersonName").data("sectorid");
//     // let attachecdFiles = $("#attachViolationFiles")[0].files
//     // let attachecdReportFiles = $("#attachViolationReportFile")[0].files

//     if (violationDescription != "") {
//         if (member != "") {
//             // if(committeeMember != false){
//             if (violationLeaderOpinion != "") {

//                 otherViolationDetails = {
//                     violationDescription: violationDescription,
//                     violationLeaderOpinion: violationLeaderOpinion,
//                     member: member,

//                     // committeeMembersId: selectedMembersIds.length > 0 ? selectedMembersIds : [],
//                     // sectorId:sectorId,
//                 }
//                 console.log('otherViolationDetails', otherViolationDetails)
//                 validOtherDetails = true;
//                 // }else{
//                 //     functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة")
//                 // }
//             } else {
//                 functions.warningAlert("من فضلك قم بادخال رأي السيد قائد القطاع", "#sectorManegrOpinion")
//             }
//         } else {
//             functions.warningAlert("من فضلك قم بادخال أعضاء اللجنة ", "#committeeMember")
//         }
//     } else {
//         functions.warningAlert("من فضلك قم بادخال الوصف الخاص بالمخالفة", "#violationDescription")
//     }

//     if (validOtherDetails) {
//         return otherViolationDetails;
//     } else {
//         return validOtherDetails
//     }
// }
quarryViolation.otherViolationDetails = () => {
  let otherViolationDetails = {};
  let validOtherDetails = false;
  let violationDescription = $("#violationDescription").val();
  let violationLeaderOpinion = $("#sectorManegrOpinion").val();
  let member = $("#committeeMemberText").val();
  /////////////////////////////////////////////////
  let committeeMember = sharedApis.checkCommitteeMember();
  let selectedMembersIds = [];
  let membersNamesText = "";

  let members = $(".committeeMember")
    .find(".membersDataBox")
    .find(".memberData");
  let committeeMemberId;
  members.each((index, memberName) => {
    committeeMemberId = Number($(memberName).data("id"));
    selectedMembersIds.push(committeeMemberId);
    membersNamesText +=
      $(memberName).find(".committeePersonRank").text() +
      " " +
      $(memberName).find(".committeePersonName").text() +
      " " +
      $(memberName).find(".committeePersonJop").text() +
      "\n";
  });
  //////////////////////////////////////////////////////////

  // let sectorId = $(".recorder").find(".committeeData").children(".committeePersonName").data("sectorid");
  // let attachecdFiles = $("#attachViolationFiles")[0].files
  // let attachecdReportFiles = $("#attachViolationReportFile")[0].files

  if (violationDescription != "") {
    if (membersNamesText != "") {
      // if(committeeMember != false){
      if (violationLeaderOpinion != "") {
        otherViolationDetails = {
          violationDescription: violationDescription,
          violationLeaderOpinion: violationLeaderOpinion,
          member: member,
          membersNamesText: membersNamesText,
          // committeeMembersId: selectedMembersIds.length > 0 ? selectedMembersIds : [],
          // sectorId:sectorId,
        };
        validOtherDetails = true;
        // }else{
        //     functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة")
        // }
      } else {
        functions.warningAlert(
          "من فضلك قم بادخال رأي السيد قائد القطاع",
          "#sectorManegrOpinion"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال القائمون بالضبط ",
        "#committeeMember"
      );
    }
  } else {
    functions.warningAlert(
      "من فضلك قم بادخال الوصف الخاص بالمخالفة",
      "#violationDescription"
    );
  }

  if (validOtherDetails) {
    return otherViolationDetails;
  } else {
    return validOtherDetails;
  }
};

quarryViolation.formActions = () => {
  let numberOfDaysBefore = functions.getViolationStartDate(3);
  functions.inputDateFormat(
    ".inputDate",
    numberOfDaysBefore,
    "today",
    "dd/mm/yyyy"
  );

  // Clear previous violations display when quarry code is cleared
  $("#quarryCode").on("input", function () {
    let val = $(this).val();
    if (!val || val.trim() === "") {
      $(".previous-violations-display").fadeOut();
      $(".previous-violations-count-value").text("0");
    }
  });

  $(".violatorMobileNumber").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });

  // Trigger API call on quarry code change
  $("#quarryCode").on("change keyup", functions.debounce(function () {
    let val = $(this).val();
    if (val && val.trim() !== "") {
      quarryViolation.getPreviousViolationsCount();
    }
  }, 500));

  // Also trigger when user leaves the field
  $("#quarryCode").on("blur", function () {
    let val = $(this).val();
    if (val && val.trim() !== "") {
      quarryViolation.getPreviousViolationsCount();
    }
  });

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

  // if($(".violationDepth").val() != "" && $(".AreaSpace").val() != ""){
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
  // }
  $(".violatorNationalId").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".prevViolationsCount").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".BonesCount").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  // $(".violationDepth").on("keypress", (e) => {
  //     return functions.isNumberKey(e)
  // })
  // $(".AreaSpace").on("keypress", (e) => {
  //     return functions.isNumberKey(e)
  // })
  $(".distanceToNearQuarry").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  // .toFixed(1);
  // $(".coordinatesTable").children("table").find("input").on("keypress",(e)=>{
  //     return functions.isNumberKey(e)
  // })

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

  // $("#committeeMemberSelect").on("change",(e)=>{
  //     $(".committeeMember").find(".committeeData").children(".committeePersonName,.committeePersonRank,.committeePersonJop").remove()
  //     let memberData = sharedApis.checkCommitteeMember()
  //     if(memberData != false){
  //         $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").children(".reSelectMember").before(`
  //             <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
  //             <p class="committeePersonRank">${memberData.CommitteeMemberRank}</p>
  //             <p class="committeePersonJop">${memberData.CommitteeMemberJopTitle}</p>
  //         `)
  //         // $(e.currentTarget).parents(".committeeSearch").hide(200)
  //         // $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").show(200)
  //     }
  // })

  ////////////////////////////////////////////////////////////////////////////////////////////////
  $(".submitSelectedMembersBtn").on("click", (e) => {
    $(".committeeMember")
      .find(".committeeData")
      .children(".membersDataBox")
      .empty();
    let membersData = sharedApis.checkCommitteeMember();
    if (membersData.length > 0) {
      membersData.forEach((memberData) => {
        $(e.currentTarget)
          .parents(".committeeSearch")
          .siblings(".committeeData")
          .children(".membersDataBox").append(`
                <div class="memberData">
                    <p class="committeePersonRank">${memberData.CommitteeMemberRank}/ </p>
                    <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
                    </div>`);
      });
      // <p class="committeePersonJop">(${memberData.CommitteeMemberJopTitle})</p>
      $(e.currentTarget).parents(".committeeSearch").hide(200);
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .show(200);
    } else {
      functions.warningAlert(
        "لم يتم إضافة أي عضو لجنة, من فضلك قم بالاضافة أولا لعرض بيانات الأعضاء"
      );
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
      .children("option")
      .removeAttr("selected");
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:first-child")
      .prop("selected", true);
  });
  ////////////////////////////////////////////////////////////////////////////////////////////////

  // $(".showOnMap").on("click", (e) => {
  //     let Coords = quarryViolation.GetCoordinates().Decimal
  //     if (Coords != undefined) {
  //         quarryViolation.drawCoordinates(Coords)
  //         $(e.currentTarget).text($(e.currentTarget).text() == "عرض على الخريطة" ? "إخفاء الخريطة" : "عرض على الخريطة")
  //         $(".ShowOnMapBox").toggle()
  //     } else {
  //         functions.warningAlert("لا يمكن عرض الخريطة قبل إدخال الإحداثيات, من فضلك أدخل الإحداثيات أولا")
  //     }
  // })

  $("#AddPoint").on("click", (e) => {
    quarryViolation.AddCoordinatePoint(e);
  });

  $("#submitQuarryViolation").on("click", (e) => {
    quarryViolation.validateForm(e);
  });
  $("#cancelQuarryViolation").on("click", (e) => {
    window.location.href =
      "/ViolationsRecorder/Pages/Registered-Violations.aspx";
  });

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
        // $(e.currentTarget).closest(".dropFilesArea").hide()
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
        // violationFiles = fileBuffer
        $(e.currentTarget).val("");
      }
    }
  });

  let violationReportFiles;
  let countOfReportFiles;
  $(".attachViolationReportFile").on("change", (e) => {
    violationReportFiles = $(e.currentTarget)[0].files;
    if (violationReportFiles.length > 0) {
      $(e.currentTarget)
        .parents(".fileBox")
        .siblings(".dropFilesArea")
        .show()
        .empty();
    }

    for (let i = 0; i < violationReportFiles.length; i++) {
      $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationReportFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (event) => {
      $(event.currentTarget).val("");
      let index = $(event.currentTarget).closest(".file").index();
      $(event.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < violationReportFiles.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(violationReportFiles[i]);
        }
      }
      violationReportFiles = fileBuffer.files;
      countOfReportFiles = violationReportFiles.length;

      if (countOfReportFiles == 0) {
        // $(e.currentTarget).closest(".dropFilesArea").hide()
        $(e.currentTarget)
          .parents(".fileBox")
          .siblings(".dropFilesArea")
          .hide();
      }
    });
    for (let i = 0; i < violationReportFiles.length; i++) {
      let fileSplited = violationReportFiles[i].name.split(".");
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

  let tableRows = $("#coordinatesTable tr:not(:first-child)");
  tableRows.each((index, row) => {
    let currentRow = $(row);
    $(currentRow)
      .find("td:nth-child(2)")
      .find("input:nth-child(1)")
      .on("keyup", (e) => {
        if (Number($(e.currentTarget).val()) == 37) {
          $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(2)")
            .attr("disabled", "disabled");
          $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(3)")
            .attr("disabled", "disabled");
        } else if (
          $(e.currentTarget).val() == "" ||
          Number($(e.currentTarget).val()) != 37
        ) {
          $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(2)")
            .removeAttr("disabled");
          $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(3)")
            .removeAttr("disabled");
        }
      });
    $(currentRow)
      .find("td:nth-child(3)")
      .find("input:nth-child(1)")
      .on("keyup", (e) => {
        if (Number($(e.currentTarget).val()) == 32) {
          $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(2)")
            .attr("disabled", "disabled");
          $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(3)")
            .attr("disabled", "disabled");
        } else if (
          $(e.currentTarget).val() == "" ||
          Number($(e.currentTarget).val()) != 32
        ) {
          $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(2)")
            .removeAttr("disabled");
          $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
          $(e.currentTarget)
            .closest("td")
            .find("input:nth-child(3)")
            .removeAttr("disabled");
        }
      });
  });

  sharedApis.getGovernrates("#violationGov");
  // sharedApis.getViolationZones("#violationArea")
  sharedApis.getViolationType("#violationType");
  sharedApis.getViolationMaterails("#quarryViolationRawType");
  sharedApis.getQuarryType("#quarryType");
  sharedApis.getEquipments(".quarryToolsBox");
  sharedApis.getCommitteeRecorder(
    ".committeeBox.recorder",
    ".committeeBox.sectorManager"
  );
  // sharedApis.getCommitteeMember(".committeeMember")
  quarryViolation.getCommitteeMember();
  $(".PreLoader").removeClass("active");
};
quarryViolation.getCommitteeMember = () => {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "GET",
      url:
        _spPageContextInfo.siteAbsoluteUrl +
        "/_api/web/lists/getbytitle('Configurations')/items?$OrderBy=Title asc&$top=1000",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        if (data != null) {
          resolve(data);
          let UsersData = data.value;
          UsersData.forEach((User) => {
            if (User.Type == "CommiteeMember") {
              $(".committeeMember").find(".selectBox").children("select")
                .append(`
                                <option value="${User.ID}" data-memberrank="${User.Rank}" data-jobtitle="${User.JobTitle1}"><span>${User.Rank}/</span> ${User.Title}</option>
                            `);
            }
          });
        } else {
          resolve([]);
        }
      },
      error: (xhr) => {
        console.log(xhr.responseText);
      },
    });
  });
};
quarryViolation.validateForm = (e) => {
  let UserId = _spPageContextInfo.userId;
  let ViolationData = {};
  let attachecdFiles = $("#attachViolationFiles")[0].files;
  let attachecdReportFiles = $("#attachViolationReportFile")[0].files;
  let otherViolationDetails = quarryViolation.otherViolationDetails();
  let violationsDimensions = quarryViolation.violationDimensionsCoordsDetails();
  let violationDetails = quarryViolation.violationDetails();
  let violatorDetails = quarryViolation.violatorDetails();
  let SectorMembers = $(".membersText").val();

  // Check if calculate by ton checkbox is checked
  let isCalculateByTon = $("#calculateByTon").is(":checked");

  let violationDateArr = violationDetails.violationDate.split("/");
  let violationDate = `${violationDateArr[1]}-${violationDateArr[0]}-${violationDateArr[2]}`;
  let violationTimeArr = violationDetails.violationTime.split("/");
  let violationTime = `${violationTimeArr[1]}-${violationTimeArr[0]}-${violationTimeArr[2]}`;

  if (SectorMembers != "") {
    if (violatorDetails != false) {
      if (violationDetails != false) {
        if (violationsDimensions != false) {
          if (attachecdFiles != null && attachecdFiles.length > 0) {
            if (
              attachecdReportFiles != null &&
              attachecdReportFiles.length > 0
            ) {
              if (otherViolationDetails != false) {
                ViolationData = {
                  // Edit violation 
                  ID: urlParams.get("taskId") !== null ? editViolationId : "",
                  IsEdit: urlParams.get("taskId") !== null ? true : false,
                  IsRejectedBefore: urlParams.get("taskId") !== null ? true : false,

                  // End edit violation
                  Title: "New Quarry Violation",
                  OffenderType: "Quarry",
                  ViolatorName: violatorDetails.violatorName,
                  NationalID: violatorDetails.violatorNationalId,
                  MobileNumber: violatorDetails.violatorMobileNumber,
                  NumOfPreviousViolations: violatorDetails.violationPrevCount,
                  ViolatorCompany: violatorDetails.companyName,
                  CommercialRegister: violatorDetails.commercialRegister,
                  Governrate: violatorDetails.violationGov,
                  ViolationsZone: violatorDetails.violationAreaName,

                  ViolationType: violationDetails.violationType,
                  BonsNumber: violationDetails.isBonesViolation
                    ? violationDetails.BonsNumber
                    : 0,
                  MaterialType: violationDetails.violationMaterail,
                  ViolationDate: violationDate,
                  ViolationTime: violationTime,
                  QuarryType: violationDetails.quarryType,
                  QuarryCode: violationDetails.quarryCode,
                  Equipments: violationDetails.selectedEquipementsIds,
                  EquipmentsCount: violationDetails.selectedEquipmentsData,

                  Depth: violationsDimensions.violationDepth,
                  Area: violationsDimensions.violationAreaSpace,
                  TotalQuantity: violationsDimensions.violationQuantity,
                  DistanceToNearestQuarry:
                    violationsDimensions.distanceToNearQuarry,
                  NearestQuarryCode: violationsDimensions.NearestQuarryCode,
                  Coordinates: violationsDimensions.coordinates,
                  CoordinatesDegrees: violationsDimensions.coordinatesDegrees,

                  Description: otherViolationDetails?.violationDescription,
                  LeaderOpinion: otherViolationDetails?.violationLeaderOpinion,
                  CommiteeMember:
                    otherViolationDetails.membersNamesText != ""
                      ? otherViolationDetails.membersNamesText
                      : "-",
                  SectorMembers: SectorMembers,
                  Sector: 0,
                };

                if (isCalculateByTon) {
                  ViolationData.MaterialUnit = "طن";
                }

                quarryViolation.submitNewViolation(e, ViolationData);
              }
            } else {
              functions.warningAlert(
                "من فضلك قم بإرفاق التقرير المصور",
                "#attachViolationReportFile"
              );
            }
          } else {
            functions.warningAlert(
              "من فضلك قم بإرفاق أصل محضر الضبط",
              "#attachViolationFiles"
            );
          }
        }
      }
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال اعضاء اللجنة");
  }
};
quarryViolation.submitNewViolation = (e, ViolationData) => {
  $(".overlay").addClass("active");
  let request = {
    Data: ViolationData,
  };
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
      $(".overlay").addClass("active");
      if (data.d.Status) {
        let ViolationId = data.d.Result.Id;
        functions.disableButton(e);
        quarryViolation.uploadAttachment(ViolationId, "Violations");
        // quarryViolation.uploadAttachment(ViolationId,"Violations","#attachViolationFiles")
        // quarryViolation.uploadAttachment(ViolationId,"Violations","#attachViolationReportFile")
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
  $(".overlay").addClass("active");
  let Data = new FormData();
  Data.append("itemId", NewViolationID);
  Data.append("listName", ListName);
  Data.append("Method", urlParams.get("taskId") !== null ? "Edit" : "",)
  let count = 0;
  let i;
  for (i = 0; i < $("#attachViolationFiles")[0].files.length; i++) {
    Data.append("file" + i, $("#attachViolationFiles")[0].files[i]);
  }
  for (
    let j = i;
    count < $("#attachViolationReportFile")[0].files.length;
    j++
  ) {
    Data.append("file" + j, $("#attachViolationReportFile")[0].files[count]);
    count++;
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
        urlParams.get("taskId") ? "تم تعديل مخالفة محجر بنجاح" : "تم إضافة مخالفة محجر جديدة بنجاح",
        false,
        "/ViolationsRecorder/Pages/Registered-Violations.aspx"
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

  let validPointsCount = 0;

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

          // Validate all rows - skip validation if field is empty (optional fields)
          if (Value !== "") {
            if (!pattern.test(Value) ||
              (fieldIndex === 0 && (firstEastInputVal > 37 || firstEastInputVal < 24)) ||
              (fieldIndex === 0 && (firstNorthInputVal > 32 || firstNorthInputVal < 22)) ||
              (fieldIndex === 1 && (secondEastInputVal > 60 || secondNorthInputVal > 60)) ||
              (fieldIndex === 2 && (thirdEastInputVal > 60 || thirdNorthInputVal > 60))) {
              rowValid = false;
              return false;
            }
          }
          Temp.push(Value);
        });

        // Only add to arrays if we have all three values for this cell
        if (Temp.length === 3 && Temp[0] !== "" && Temp[1] !== "" && Temp[2] !== "") {
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

    // Only count this row as valid if both East and North cells have complete data
    if (rowValid && PointArr.length === 2) {
      validPointsCount++;

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

  // Require at least 1 valid point (changed from exactly 3)
  if (IsValid && validPointsCount >= 1) {
    return {
      Degree: PointsArr,
      Decimal: DecimalsArr,
      Numbers: NumbersArr,
    };
  } else {
    return false;
  }
};
quarryViolation.AddCoordinatePoint = (e) => {
  let coordinatesTable = $("#coordinatesTable");

  // Remove the 3-point limit check to allow adding more points
  // The old code had a check that prevented adding more than 3 points
  // Now we allow unlimited points

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
  let RowsLength = $("#coordinatesTable table").find("tr").length - 1; // Subtract header row

  // Changed from requiring 3 points to requiring at least 1 point
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
          quarryViolation.OrderTableRow();
        });
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      customClass: "sweetStyle",
      title: "لا يمكن الحذف",
      text: "يجب أن يكون هناك نقطة واحدة على الأقل للإحداثيات", // Updated message
      confirmButtonColor: "#3085d6",
      confirmButtonText: "موافق",
      heightAuto: true,
    });
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
  let pointLat;
  let pointLng;
  let marker;
  let splitedCoords = Coords.split("],");
  let firstPoint = splitedCoords[0];
  let filteredFirstPoint = firstPoint.replace("[[", "").trim().split(",");
  pointLat = filteredFirstPoint[0];
  pointLng = filteredFirstPoint[1];
  marker = `marker=${pointLat};${pointLng}`;
  $(".ShowOnMapBox").find("#coordinatesMap").empty();
  $(".ShowOnMapBox").find("#coordinatesMap").append(`
        <div class="embed-container">
            <iframe width="500" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" title="World Bank Map" src="//www.arcgis.com/apps/Embed/index.html?webmap=051417efba8a4a14ac04ef195beb3b05&extent=26.6843,26.2561,33.4299,29.5516&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light&${marker}"></iframe>
        </div>
    `);

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
quarryViolation.editViolation = () => {
  if (urlParams.get("taskId") !== null) {
    $(".PreLoader").addClass("active");
    functions
      .requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
        {
          Id: urlParams.get("taskId"),
        }
      )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        let violationData = data.d.Violation;
        editViolationId = data.d.ViolationId
        functions.commonEditData(violationData, data.d.ViolationId, 4);

        $("#violatorMobileNumber").val(violationData.MobileNumber || "");

        $("#BonesCount").val(violationData.BonsNumber).trigger("change");
        $("#quarryType").val(violationData.QuarryType).trigger("change");
        $("#quarryCode").val(violationData.QuarryCode);
        violationData.Equipments.forEach((equipment, index) => {
          let selectedInput = $(`label[for="${equipment.Name}"]`);
          selectedInput.trigger("click");
          selectedInput
            .siblings("#toolCount")
            .val(violationData.Equipments_Count[index].count);
        });
        $("#violationDepth").val(violationData.Depth);
        $("#AreaSpace").val(violationData.Area);
        $(".totalAreaSpace").val(
          ($("#violationDepth").val() * $("#AreaSpace").val()).toFixed(3)
        );
        $("#distanceToNearQuarry").val(violationData.DistanceToNearestQuarry);
        $("#NearestQuarryNumber").val(violationData.NearestQuarryCode);
        $("#s4-workspace").scrollTop(0, 0);
        $(".PreLoader").removeClass("active");
      });
  }
};

quarryViolation.getPreviousViolationsCount = () => {
  let quarryCode = $("#quarryCode").val();

  // Check if quarryCode exists and is not undefined/null before calling trim
  if (!quarryCode || quarryCode.trim() === "") {
    $(".previous-violations-display").fadeOut();
    $(".previous-violations-count-value").text("0");
    return;
  }

  let requestData = {
    request: {
      Data: {
        OffenderType: "Quarry",
        QuarryCode: quarryCode.trim() // Trim the value here
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

        // Update only the display span
        $(".previous-violations-count-value").text(count);
        $(".previous-violations-display").fadeIn();

        // Optional: Add animation
        $(".previous-violations-display").addClass("fadeIn");
        setTimeout(() => {
          $(".previous-violations-display").removeClass("fadeIn");
        }, 500);
      } else {
        // Hide section if no data
        $(".previous-violations-display").fadeOut();
        $(".previous-violations-count-value").text("0");
      }
    },
    error: (xhr) => {
      console.log("Error fetching previous violations count:", xhr.responseText);
      $(".previous-violations-display").fadeOut();
      $(".previous-violations-count-value").text("0");
      functions.warningAlert("حدث خطأ في جلب عدد المخالفات السابقة");
    }
  });
};

export default quarryViolation;
