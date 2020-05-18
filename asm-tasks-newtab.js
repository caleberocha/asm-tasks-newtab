// ==UserScript==
// @name         ASM - Abrir tarefa em nova aba
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Toma essa ASM!!!
// @author       Calebe
// @match        https://asm.procempa.com.br/View/Web/Forms/FrmListTask.aspx*
// @grant        none
// ==/UserScript==

(function() {
    var scr = document.createElement('script');
    scr.innerHTML = `
        var aspxCallback = function (result, context) {
        var collection = aspxGetControlCollection();
        collection.DoFinalizeCallback();
        var control = collection.Get(context);
        if (control != null)
            control.DoCallback = function (result) {
            if (
                this.IsCallbackAnimationEnabled() &&
                this.CheckBeginCallbackAnimationInProgress(result)
            )
                return;
            result = _aspxTrim(result);
            if (result.indexOf(__aspxCallbackResultPrefix) != 0)
                this.ProcessCallbackGeneralError(result);
            else {
                var resultObj = null;
                try {
                resultObj = this.EvalCallbackResult(result);
                } catch (e) {}
                if (resultObj) {
                if (resultObj.redirect) {
                    window.open(resultObj.redirect);
                } else if (resultObj.generalError) {
                    this.ProcessCallbackGeneralError(resultObj.generalError);
                } else {
                    var errorObj = resultObj.error;
                    if (errorObj) this.ProcessCallbackError(errorObj);
                    else {
                    if (resultObj.cp) {
                        for (var name in resultObj.cp) this[name] = resultObj.cp[name];
                    }
                    var callbackInfo = this.DequeueCallbackInfo(resultObj.id);
                    if (callbackInfo.type == ASPxCallbackType.Data)
                        this.ProcessCustomDataCallback(resultObj.result, callbackInfo);
                    else this.ProcessCallback(resultObj.result);
                    }
                }
                }
            }
            this.DoLoadCallbackScripts();
            };
        control.DoCallback(result);
        };
    `;
    document.body.appendChild(scr);
})();