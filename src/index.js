const traceur = require('traceur');
traceur.require.makeDefault(function(filename) {
  return filename.indexOf('node_modules') === -1;
}, { asyncFunctions: true });
const APIGatewayManager = require('./aws-manager').APIGatewayManager;
const manager = new APIGatewayManager();

const path  = require('path'),
  fs        = require('fs'),
  BbPromise = require('bluebird');
module.exports = function(S) {
  class PluginApiGatewayStageVariables extends S.classes.Plugin {
    constructor() {
      super();
      this.name = 'serverless-api-gateway-deploy-stage-variables';
    }

    registerActions() {
      S.addAction(this._customAction.bind(this), {
        description: 'A custom action from a custom plugin',
        context: 'env',
        contextAction: 'deploy',
        options: [
          {
            option: "stage",
            shortcut: "s",
            description: "stage you want to deploy env variables to"
          },
        ]
      });
      return BbPromise.resolve();
    }

    _customAction(evt) {
      return new BbPromise(function (resolve, reject) {
        if (evt.options.stage === true || !evt.options.stage) {
          throw new Error('Missing Stage name');
        }
        if (!S.getProject().stages[evt.options.stage]) {
          throw new Error('Unknown Stage name');
        }
        const apiId = S.getProject().variables.api_id;
        if (!apiId) {
          throw new Error('Please provide an api_id inside s-variables-common.json');
        }
        const vars = S.getProject().stages[evt.options.stage].variables.stage_variables;
        if (!vars) {
          throw new Error(
            `Please provide stage_variables inside s-variables-${evt.options.stage}.json`
          );
        }
        manager.replaceStageVariables(apiId, evt.options.stage, vars)
          .then(() => resolve(evt))
          .catch(err => reject(err));
      });
    }
  }
  // Export Plugin Class
  return PluginApiGatewayStageVariables;
};