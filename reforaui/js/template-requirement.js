var template = "\
<li id='li-req-##REQ_NO##'>\
    <div class='collapsible-header'><i class='material-icons prefix'>insert_drive_file</i>##ABSTRACT_ID##-##CONCRETE_ID##-##FINAL_ID##</div>\
    <div class='collapsible-body req-content'>\
         <input id='reqSpecCriteriaInput-##REQ_NO##' hidden='true' type='file' accept='.json' onchange='Tool.readReqSpecCriteria(##REQ_NO##)'>\
        <div id='toolbox-req' class='right-align'>\
            <!-- Upload Spec Criteria -->\
            <a id='btn-req-upload-spec-criteria-##REQ_NO##' class='btn-floating blue tooltipped' data-position='bottom' data-delay='0' data-tooltip='Upload Spec Criteria' onClick='PageTool.onClickReqUploadSpecCriteria(##REQ_NO##)'><i class='material-icons'>file_upload</i></a>\
            <!-- Delete -->\
            <a id='btn-req-delete-##REQ_NO##' class='btn-floating red tooltipped' data-position='bottom' data-delay='0' data-tooltip='Delete Requirement' onClick='PageTool.onClickDeleteReq(##REQ_NO##)'><i class='material-icons'>delete</i></a>\
        </div>\
      <div class='row'>\
      <!-- Abstract -->\
      <div class='col s12'>\
          <h6>Abstract</h6>\
          <div class='row'>\
              <div class='input-field col s3 push-s1'>\
                  <input id='abstract-id-##REQ_NO##' type='text' class='validate' value='##ABSTRACT_ID##'>\
                  <label class='active' id='label-abstract-id-##REQ_NO##' for='abstract-id-##REQ_NO##' >ID</label>             \
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='abstract-title-##REQ_NO##' class='materialize-textarea'>##ABSTRACT_TITLE##</textarea>\
                  <label class='active' id='label-abstract-title-##REQ_NO##' for='abstract-title-##REQ_NO##' data-position='bottom' data-delay='0' data-tooltip=''>Title</label>\
              </div>\
          </div> \
      </div>\
\
      <!-- Concrete -->\
      <div class='col s12'>\
          <h6>Concrete</h6>\
          <div class='row'>\
              <div class='input-field col s3 push-s1'>\
                  <input id='concrete-id-##REQ_NO##' type='text' class='validate' value='##CONCRETE_ID##'>\
                  <label class='active' 'id='label-concrete-id-##REQ_NO##' for='concrete-id-##REQ_NO##'>ID</label>             \
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='concrete-monitor-##REQ_NO##' class='materialize-textarea'>##CONCRETE_MONITOR##</textarea>\
                  <label class='active' id='label-concrete-monitor-##REQ_NO##' for='concrete-monitor-##REQ_NO##'>Monitor</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='concrete-analyze-##REQ_NO##' class='materialize-textarea' value='concrete.analyze'>##CONCRETE_ANALYZE##</textarea>\
                  <label class='active' id='label-concrete-analyze-##REQ_NO##' for='concrete-analyze-##REQ_NO##'>Analyze</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='concrete-plan-##REQ_NO##' class='materialize-textarea' value='concrete.plan'>##CONCRETE_PLAN##</textarea>\
                  <label class='active' id='label-concrete-plan-##REQ_NO##' for='concrete-plan-##REQ_NO##'>Plan</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='concrete-execute-##REQ_NO##' class='materialize-textarea' value='concrete.execute'>##CONCRETE_EXECUTE##</textarea>\
                  <label class='active' id='label-concrete-execute-##REQ_NO##' for='concrete-execute-##REQ_NO##'>Execute</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='concrete-knowledge-##REQ_NO##' class='materialize-textarea' value='concrete.knowledge'>##CONCRETE_KNOWLEDGE##</textarea>\
                  <label class='active' id='label-concrete-knowledge-##REQ_NO##' for='concrete-knowledge-##REQ_NO##'>Knowledge</label>\
              </div>\
          </div> \
      </div>\
\
      <!-- Final -->\
      <div class='col s12'>\
          <h6>Final</h6>\
          <div class='row'>\
              <div class='input-field col s3 push-s1'>\
                  <input id='final-id-##REQ_NO##' type='text' class='validate' value='##FINAL_ID##'>\
                  <label class='active for='final-id-##REQ_NO##'>ID</label>             \
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='final-monitor-##REQ_NO##' class='materialize-textarea'>##FINAL_MONITOR##</textarea>\
                  <label class='active for='final-monitor-##REQ_NO##'>Monitor</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='final-analyze-##REQ_NO##' class='materialize-textarea'>##FINAL_ANALYZE##</textarea>\
                  <label class='active for='final-analyze-##REQ_NO##'>Analyze</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='final-plan-##REQ_NO##' class='materialize-textarea'>##FINAL_PLAN##</textarea>\
                  <label class='active for='final-plan-##REQ_NO##'>Plan</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='final-execute-##REQ_NO##' class='materialize-textarea'>##FINAL_EXECUTE##</textarea>\
                  <label class='active for='final-execute-##REQ_NO##'>Execute</label>\
              </div>\
              <div class='input-field col s10 push-s1'>\
                  <textarea id='final-knowledge-##REQ_NO##' class='materialize-textarea'>##FINAL_KNOWLEDGE##</textarea>\
                  <label class='active for='final-knowledge-##REQ_NO##'>Knowledge</label>\
              </div>\
          </div> \
      </div>\
\
      <!-- Quality -->\
      <div class='col s12 req-content'>\
          <h6>Quality Attributes</h6>\
          <div class='col s11 push-s1 m11 push-m1 l5 push-l1'>\
              <input type='checkbox' id='selfconfiguring-##REQ_NO##' ##CHECKED_SELFCONFIGURING## onClick='PageTool.toggleCheck(this.id)' />\
              <label id='label-selfconfiguring-##REQ_NO##' for='selfconfiguring-##REQ_NO##' data-position='bottom' data-delay='0' data-tooltip=''>Self-Configuring</label>\
          </div>\
\
          <div class='col s11 push-s1  m11 push-m1 l5 push-l1'>\
              <input type='checkbox' id='selfhealing-##REQ_NO##' ##CHECKED_SELFHEALING## onClick='PageTool.toggleCheck(this.id)' />\
              <label id='label-selfhealing-##REQ_NO##' for='selfhealing-##REQ_NO##' data-position='bottom' data-delay='0' data-tooltip=''>Self-Healing</label>\
          </div>\
          <div class='col s11 push-s1  m11 push-m1 l5 push-l1'>\
              <input type='checkbox' id='selfoptimizing-##REQ_NO##' ##CHECKED_SELFOPTIMIZING## onClick='PageTool.toggleCheck(this.id)' />\
              <label id='label-selfoptimizing-##REQ_NO##' for='selfoptimizing-##REQ_NO##' data-position='bottom' data-delay='0' data-tooltip=''>Self-Optimizing</label>\
          </div>\
          <div class='col s11 push-s1  m11 push-m1 l5 push-l1'>\
              <input type='checkbox' id='selfprotecting-##REQ_NO##' ##CHECKED_SELFPROTECTING## onClick='PageTool.toggleCheck(this.id)'/>\
              <label id='label-selfprotecting-##REQ_NO##' for='selfprotecting-##REQ_NO##' data-position='bottom' data-delay='0' data-tooltip=''>Self-Protecting</label>\
          </div>\
      </div>\
\
  </div>\
</div>\
</li>";