var Tool = (function () {
    /*
     * This is a data structure for requirements.
     */
    var projectData = {};
    
    var countReqs = 0;
    /*
     * Getter of requirements.
     */
    var getProjectData = function () {
        return projectData;
    }
    
    /* Reads Spec Criteria */
    var readSpecCriteria = function() {
      var fileList = document.getElementById("openSpecCriteriaFileInput").files;

      // 읽기
      var reader = new FileReader();
      reader.readAsText(fileList[0]);

      //로드 한 후
      reader.onload = function  () {
          var jsonObj = JSON.parse(reader.result);
          $("#textareaArea").val(jsonObj.area).trigger('autoresize');

          $("#textareaBaseMonitor").val(jsonObj.base_monitor).trigger('autoresize'); $("#labelTextareaBaseMonitor").click();
          $("#textareaBaseAnalyze").val(jsonObj.base_analyze).trigger('autoresize'); $("#labelTextareaBaseAnalyze").click();
          $("#textareaBasePlan").val(jsonObj.base_plan).trigger('autoresize'); $("#labelTextareaBasePlan").click();
          $("#textareaBaseExecute").val(jsonObj.base_execute).trigger('autoresize'); $("#labelTextareaBaseExecute").click();      
          $("#textareaBaseKnowledge").val(jsonObj.base_knowledge).trigger('autoresize'); $("#labelTextareaBaseKnowledge").click();

          $("#textareaConsequenceSelfconfiguring").val(jsonObj.consequence_selfconfiguring).trigger('autoresize'); $("#labelTextareaConsequenceSelfconfiguring").click();
          $("#textareaConsequenceSelfhealing").val(jsonObj.consequence_selfhealing).trigger('autoresize'); $("#labelTextareaConsequenceSelfhealing").click();
          $("#textareaConsequenceSelfoptimizing").val(jsonObj.consequence_selfoptimizing).trigger('autoresize'); $("#labelTextareaConsequenceSelfoptimizing").click();
          $("#textareaConsequenceSelfprotecting").val(jsonObj.consequence_selfprotecting).trigger('autoresize'); $("#labelTextareaConsequenceSelfprotecting").click();

      };
    };
    
    /*
     * Reads Requirements Project
     */
    var readProject = function() {
        var fileList = document.getElementById("openFileInput").files;

      // 읽기
      var reader = new FileReader();
      reader.readAsText(fileList[0]);

      //로드 한 후
      reader.onload = function  () {          
          var jsonObj = JSON.parse(reader.result);
          
          // Saves to data structure.
          projectData = jsonObj;
          
          // Counts the number of requirements.
          countReqs = jsonObj.requirements.length;
              
          for(var i = 0; i < jsonObj.requirements.length; i++) {              
              var liStr = template;
              
              liStr = liStr.replace(/##REQ_NO##/gi, i)
                  .replace(/##ABSTRACT_ID##/gi, jsonObj.requirements[i].abstract.id)
                  .replace("##ABSTRACT_TITLE##", jsonObj.requirements[i].abstract.title)
                  .replace(/##CONCRETE_ID##/gi, jsonObj.requirements[i].concrete.id)
                  .replace("##CONCRETE_MONITOR##", jsonObj.requirements[i].concrete.monitor)
                  .replace("##CONCRETE_ANALYZE##", jsonObj.requirements[i].concrete.analyze)
                  .replace("##CONCRETE_PLAN##", jsonObj.requirements[i].concrete.plan)
                  .replace("##CONCRETE_EXECUTE##", jsonObj.requirements[i].concrete.execute)
                  .replace("##CONCRETE_KNOWLEDGE##", jsonObj.requirements[i].concrete.knowledge)
              
                  .replace(/##FINAL_ID##/gi, jsonObj.requirements[i].final.id)
                  .replace("##FINAL_MONITOR##", jsonObj.requirements[i].final.monitor)
                  .replace("##FINAL_ANALYZE##", jsonObj.requirements[i].final.analyze)
                  .replace("##FINAL_PLAN##", jsonObj.requirements[i].final.plan)
                  .replace("##FINAL_EXECUTE##", jsonObj.requirements[i].final.execute)
                  .replace("##FINAL_KNOWLEDGE##", jsonObj.requirements[i].final.knowledge);
              
              if(jsonObj.requirements[i].quality.selfconfiguring == "Y") {
                  liStr = liStr.replace("##CHECKED_SELFCONFIGURING##", "CHECKED");
              }
              
              if(jsonObj.requirements[i].quality.selfhealing == "Y") {
                  liStr = liStr.replace("##CHECKED_SELFHEALING##", "CHECKED");
              }
              
              if(jsonObj.requirements[i].quality.selfoptimizing == "Y") {
                  liStr = liStr.replace("##CHECKED_SELFOPTIMIZING##", "CHECKED");
              }
              
              if(jsonObj.requirements[i].quality.selfprotecting == "Y") {
                 liStr = liStr.replace("##CHECKED_SELFPROTECTING##", "CHECKED");
              }
              
              $("#ul-req").append(liStr);
          }
      };
    };
    
    /*
     * Makes Spec Criteria to JSON.
     */
    var makeSpecCriteriaToJSON = function () {
        // Sets JSON.
        var jsonObj = {};

         jsonObj.area = $("#textareaArea").val();

         jsonObj.base_monitor = $("#textareaBaseMonitor").val();
         jsonObj.base_analyze = $("#textareaBaseAnalyze").val();
         jsonObj.base_plan = $("#textareaBasePlan").val();
         jsonObj.base_execute = $("#textareaBaseExecute").val();
         jsonObj.base_knowledge = $("#textareaBaseKnowledge").val();

         jsonObj.consequence_selfconfiguring = $("#textareaConsequenceSelfconfiguring").val();
         jsonObj.consequence_selfhealing = $("#textareaConsequenceSelfhealing").val();
         jsonObj.consequence_selfoptimizing = $("#textareaConsequenceSelfoptimizing").val();
         jsonObj.consequence_selfprotecting = $("#textareaConsequenceSelfprotecting").val();
        
        // Makes JSON.
        var json = JSON.stringify(jsonObj);
        var blob = new Blob([json], {type: "application/json"});
        var url  = URL.createObjectURL(blob);

        // Downloads JSON.
        var a = document.createElement('a');
        a.href = url;
        a.download = 'spec-criteria.json';
        a.textContent = 'Download';
        a.click();
    };
    
    /*
     * Makes Project to JSON.
     */
    var makeProjectToJSON = function () {
        
        // Sets JSON.
        var jsonObj = {};
        jsonObj.requirements = [];
        
        var i = 0;
        
        for (var j = 0; j < countReqs; j++) {
            if($("#li-req-" + j) != null) {
                console.log("record: " + i);
                                
                var reqObj = {};
                
                reqObj.abstract = {};
                reqObj.concrete = {};
                reqObj.final = {};
                reqObj.quality = {};
                
                reqObj.abstract.id = $("#abstract-id-" + j).val();
                reqObj.abstract.title = $("#abstract-title-" + j).val();

                reqObj.concrete.id = $("#concrete-id-" + j).val();
                reqObj.concrete.monitor = $("#concrete-monitor-" + j).val();
                reqObj.concrete.analyze = $("#concrete-analyze-" + j).val();
                reqObj.concrete.plan = $("#concrete-plan-" + j).val();
                reqObj.concrete.execute = $("#concrete-execute-" + j).val();
                reqObj.concrete.knowledge = $("#concrete-knowledge-" + j).val();

                reqObj.final.id = $("#final-id-" + j).val();
                reqObj.final.monitor = $("#final-monitor-" + j).val();
                reqObj.final.analyze = $("#final-analyze-" + j).val();
                reqObj.final.plan = $("#final-plan-" + j).val();
                reqObj.final.execute = $("#final-execute-" + j).val();
                reqObj.final.knowledge = $("#final-knowledge-" + j).val();
                
                reqObj.quality.selfconfiguring = $("#selfconfiguring-" + j).attr("checked") == null ? "N" : "Y";
                reqObj.quality.selfhealing = $("#selfhealing-" + j).attr("checked") == null ? "N" : "Y";
                reqObj.quality.selfoptimizing = $("#selfoptimizing-" + j).attr("checked") == null ? "N" : "Y";
                reqObj.quality.selfprotecting = $("#selfprotecting-" + j).attr("checked") == null ? "N" : "Y";
                
                jsonObj.requirements.push(reqObj);
                
                i++;
            }
        }

        
        // Makes JSON.
        var json = JSON.stringify(jsonObj);
        var blob = new Blob([json], {type: "application/json"});
        var url  = URL.createObjectURL(blob);

        // Downloads JSON.
        var a = document.createElement('a');
        a.href = url;
        a.download = 'req-proj.json';
        a.textContent = 'Download';
        a.click();
    };
    
    var addReq = function () {
        var liStr = template;

        liStr = liStr.replace(/##REQ_NO##/gi, countReqs)
                  .replace(/##ABSTRACT_ID##/gi, "")
                  .replace("##ABSTRACT_TITLE##", "")
                  .replace(/##CONCRETE_ID##/gi, "")
                  .replace("##CONCRETE_MONITOR##", "")
                  .replace("##CONCRETE_ANALYZE##", "")
                  .replace("##CONCRETE_PLAN##", "")
                  .replace("##CONCRETE_EXECUTE##", "")
                  .replace("##CONCRETE_KNOWLEDGE##", "")
              
                  .replace(/##FINAL_ID##/gi, "")
                  .replace("##FINAL_MONITOR##", "")
                  .replace("##FINAL_ANALYZE##", "")
                  .replace("##FINAL_PLAN##", "")
                  .replace("##FINAL_EXECUTE##", "")
                  .replace("##FINAL_KNOWLEDGE##", "")
                  .replace("##CHECKED_SELFCONFIGURING##", "")
                  .replace("##CHECKED_SELFHEALING##", "")
                  .replace("##CHECKED_SELFOPTIMIZING##", "")
                  .replace("##CHECKED_SELFPROTECTING##", "");
        
        $("#ul-req").append(liStr);
        
        countReqs++;
        
        $('.tooltipped').tooltip({delay: 0});
    };
    
    /* 
     * Req - Read Spec Criteria
     */
    var readReqSpecCriteria = function (param) {
        var fileList = document.getElementById("reqSpecCriteriaInput-" + param).files;
        
        var reader = new FileReader();
        reader.readAsText(fileList[0]);

      //로드 한 후
      reader.onload = function  () {
          var jsonObj = JSON.parse(reader.result);
          
          $("#label-abstract-title-" + param).addClass("tooltipped").attr("data-tooltip", jsonObj.area);
          
          $("#concrete-monitor-" + param).attr("placeholder", jsonObj.base_monitor);
          $("#concrete-analyze-" + param).attr("placeholder", jsonObj.base_analyze);
          $("#concrete-plan-" + param).attr("placeholder", jsonObj.base_plan);
          $("#concrete-execute-" + param).attr("placeholder", jsonObj.base_execute);
          $("#concrete-knowledge-" + param).attr("placeholder", jsonObj.base_knowledge);
          
          $("#label-selfconfiguring-" + param).addClass("tooltipped").attr("data-tooltip", jsonObj.consequence_selfconfiguring);
          $("#label-selfhealing-" + param).addClass("tooltipped").attr("data-tooltip", jsonObj.consequence_selfhealing);
          $("#label-selfoptimizing-" + param).addClass("tooltipped").attr("data-tooltip", jsonObj.consequence_selfoptimizing);
          $("#label-selfprotecting-" + param).addClass("tooltipped").attr("data-tooltip", jsonObj.consequence_selfprotecting);
          
          $('.tooltipped').tooltip({delay: 0});
      };      
    };
        
    var deleteReq = function (i) {
        if($("#li-req-" + i) == null) {
            console.log("a");
            return;
        }
        $("#li-req-" + i).remove();
    };
    
    return {
        getProjectData: getProjectData,
        
        readSpecCriteria: readSpecCriteria,
        readProject: readProject,
        
        makeSpecCriteriaToJSON: makeSpecCriteriaToJSON,
        
        makeProjectToJSON: makeProjectToJSON,
        addReq: addReq,
        
        readReqSpecCriteria: readReqSpecCriteria,
        
        deleteReq: deleteReq
    };
})();