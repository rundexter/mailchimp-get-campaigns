var _ = require('lodash'),
    request = require('request'),
    util = require('./util'),
    querystring = require('querystring'),
    pickInputs = {
        fields: {
            key: 'fields',
            type: 'array'
        },
        exclude_fields: {
            key: 'exclude_fields',
            type: 'array'
        },
        type: {
            key: 'type',
            type: 'array'
        },
        status: {
            key: 'status',
            type: 'array'
        },
        before_send_time: 'before_send_time',
        before_create_time: 'before_create_time',
        count: {
            key: 'count',
            validate: {
                check: 'isInteger'
            }
        }
    },
    pickOutputs = {
        total_items: 'total_items',
        id: { keyName: 'campaigns', fields: ['id']},
        type: { keyName: 'campaigns', fields: ['type']},
        create_time: { keyName: 'campaigns', fields: ['create_time']},
        archive_url: { keyName: 'campaigns', fields: ['archive_url']},
        status: { keyName: 'campaigns', fields: ['status']},
        emails_sent: { keyName: 'campaigns', fields: ['emails_sent']},
        _links: { keyName: 'campaigns', fields: ['_links']}
    };

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var accessToken = dexter.provider('mailchimp').credentials('access_token'),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        if (!dexter.environment('mailchimp_server'))
            return this.fail('A [mailchimp_server] environment need for this module.');

        if (validateErrors)
            return this.fail(validateErrors);

        if(inputs.type) {
            var checkTypeArray = _.map(inputs.type, function(value) {return value.trim();});
            if(_.difference(checkTypeArray, ['regular', 'plaintext', 'absplit', 'rss', 'variate']).length != 0) {
                return this.fail('[type]. Possible values: "regular", "plaintext", "absplit", "rss", "variate"');
            }
            inputs.type = checkTypeArray.join();
        }

        if(inputs.status) {
            var checkStatusArray = _.map(inputs.status, function(value) {return value.trim()});
            if (_.difference(checkStatusArray, ['save', 'paused', 'schedule', 'sending', 'sent']).length != 0) {
                return this.fail('[status]. Possible values: "save", "paused", "schedule", "sending", "sent"');
            }
            inputs.status = checkStatusArray.join();
        }

        if (inputs.fields)
            inputs.fields = _.map(inputs.fields, function (value) {return value.trim();}).join();

        if (inputs.exclude_fields)
            inputs.exclude_fields = _.map(inputs.exclude_fields, function(value) {return value.trim();}).join();

        var queryParams = querystring.stringify(inputs);

        var uri = queryParams ? 'campaigns?' + queryParams : 'campaigns',
            baseUrl = 'https://' + dexter.environment('mailchimp_server') + '.api.mailchimp.com/3.0/';

        request({
            baseUrl: baseUrl,
            method: 'GET',
            uri: uri,
            json: true,
            auth : {
                "bearer" : accessToken
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                this.complete(util.pickOutputs(body, pickOutputs));
            } else {
                this.fail(error || body);
            }
        }.bind(this));
    }
};
