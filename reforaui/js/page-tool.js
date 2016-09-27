var PageTool = (function () {
    /* 
     * onClick: Open The Project
     */
    var onClickOpenProject = function() {
      //$("#openFileInput").click();
      $("#div-requirements-project").removeClass("hide");
      $("#div-spec-criteria").addClass("hide");
    };

    /* 
     * onClick: Create New Project
     */
    var onClickCreateSpecCriteria = function() {
      $("#div-spec-criteria").removeClass("hide");
      $("#div-requirements-project").addClass("hide");
    };
    
    /*
     * Functions for Spec Criteria
     */
    
    /*
     * onClick: Delete Spec Criteria
     */
    var onClickDeleteSpecCriteria = function (param) {
        if(param == 'unchecked') {
            $('#modal-delete-spec-criteria').openModal();
        } else {
            $("#textareaArea").val("").trigger('autoresize');

            $("#textareaBaseMonitor").val("").trigger('autoresize');
            $("#textareaBaseAnalyze").val("").trigger('autoresize');
            $("#textareaBasePlan").val("").trigger('autoresize');
            $("#textareaBaseExecute").val("").trigger('autoresize');
            $("#textareaBaseKnowledge").val("").trigger('autoresize');

            $("#textareaConsequenceSelfconfiguring").val("").trigger('autoresize');
            $("#textareaConsequenceSelfhealing").val("").trigger('autoresize');
            $("#textareaConsequenceSelfoptimizing").val("").trigger('autoresize');
            $("#textareaConsequenceSelfprotecting").val("").trigger('autoresize');

            var openSpecCriteriaFileInput = document.getElementById("openSpecCriteriaFileInput");
            openSpecCriteriaFileInput.value = "";
        }        
    };
    
    /*
     * onClick: Upload Spec Criteria
     */
    var onClickUploadSpecCriteria = function() {
      $("#openSpecCriteriaFileInput").click();
    };
    
    /*
     * onClick: Download Spec Criteria
     */
    var onClickDownloadSpecCriteria = function () {
        Tool.makeSpecCriteriaToJSON();
    };
    
    /*
     * onClick: Adds Requirements
     */
    var onClickAddReq = function () {
        
    };
    
    /*
     * For projects
     */
    
    /*
     * onClick: Upload Project
     */
    var onClickUploadProject = function () {
      $("#openFileInput").click();
    };
    
    /*
     * onClick: Download Project
     */
    var onClickDownloadProject = function () {
        Tool.makeProjectToJSON();
    };
    
    /*
     * onClick: Req - Upload Spec Criteria
     */
    var onClickReqUploadSpecCriteria = function (param) {
        $("#reqSpecCriteriaInput-" + param).click();
    };    
    
    /*
     * onClick
     */
    var onClickAddReq = function () {
        Tool.addReq();
    };
    
    
    /*
     * 
     */
    var onClickDeleteReq = function (param) {
        Tool.deleteReq(param);
    };
    
    var toggleCheck = function (id) {
        
        if($("#" + id).attr("checked") == null) {
            $("#" + id).attr("checked", "");
            console.log("null --> checked");
        } else {            
            $("#" + id).removeAttr("checked");
            console.log("checked --> null");
        }
    }
    
    /*
    var specCriteria = {};

    var saveSpecCriteria = function () {
         specCriteria.area = $("#textareaArea").val();

         specCriteria.base_monitor = $("#textareaBaseMonitor").val();
         specCriteria.base_analyze = $("#textareaBaseAnalyze").val();
         specCriteria.base_plan = $("#textareaBasePlan").val();
         specCriteria.base_execute = $("#textareaBaseExecute").val();
         specCriteria.base_knowledge = $("#textareaBaseKnowledge").val();

         specCriteria.consequence_selfconfiguring = $("#textareaConsequenceSelfconfiguring").val();
         specCriteria.consequence_selfhealing = $("#textareaConsequenceSelfhealing").val();
         specCriteria.consequence_selfoptimizing = $("#textareaConsequenceSelfoptimizing").val();
         specCriteria.consequence_selfprotecting = $("#textareaConsequenceSelfprotecting").val();
    };

    var requirementsIdArray = [];
    var jsonObjLength;
    var jsonObj;

    

    
    function fileRead() {
      var fileList = document.getElementById("openFileInput").files;

      // 읽기
      var reader = new FileReader();
      reader.readAsText(fileList[0]);

      //로드 한 후
      reader.onload = function  () {
          jsonObj = JSON.parse(reader.result);
          jsonObjLength = Object.keys(jsonObj).length;

          $("#requirements").html("Load Completed!");

          for(var i = 0; i < jsonObjLength; i++) {
              var requirementIds = new Object();
              requirementIds.requirement = "requirement-" + i;
              requirementIds.title = "title-" + i;
              requirementIds.monitor = "monitor-" + i;
              requirementIds.analyze = "analyze-" + i;
              requirementIds.plan = "plan-" + i;
              requirementIds.execute = "execute-" + i;

              requirementsIdArray.push(requirementIds);

              var requirement = "<div class='requirement' id='requirement-" + i+ "'><p>Title</p><textarea class='title' onkeyup='resize(this)' id='title-" + i + "'>" + jsonObj[i].title + "</textarea><p>Monitor</p><textarea class='monitor' onkeyup='resize(this)' id='monitor-" + i + "'>" + jsonObj[i].monitor + "</textarea><p>Analyze</p><textarea class='analyze' onkeyup='resize(this)' id='analyze-" + i + "'>" + jsonObj[i].analyze + "</textarea><p>Plan</p><textarea class='plan' onkeyup='resize(this)' id='plan-" + i + "'>" + jsonObj[i].plan + "</textarea><p>Execute</p><textarea class='execute' onkeyup='resize(this)' id='execute-" + i + "'>" + jsonObj[i].execute + "</textarea></div>";

              $("#requirements").append(requirement);

              $("#btn-reset").removeClass("hide");
              $("#btn-download").removeClass("hide");
          }
      };
    }

    function clickResetButton() {
           file.onchange();
       }

       function resize(obj) {
         obj.style.height = "0px";
         obj.style.height = (10 + obj.scrollHeight)+"px";
       }
*/
    
    return {
        onClickCreateSpecCriteria: onClickCreateSpecCriteria,
        onClickOpenProject: onClickOpenProject,
        
        onClickDeleteSpecCriteria: onClickDeleteSpecCriteria,
        onClickUploadSpecCriteria: onClickUploadSpecCriteria,
        onClickDownloadSpecCriteria: onClickDownloadSpecCriteria,
        
        onClickUploadProject: onClickUploadProject,
        onClickDownloadProject: onClickDownloadProject,
        onClickAddReq: onClickAddReq,
        
        onClickReqUploadSpecCriteria: onClickReqUploadSpecCriteria,
        onClickDeleteReq: onClickDeleteReq,
        
        toggleCheck: toggleCheck
        
    };
})();