/*
 * New Condition Format plug-in
 * Copyright (c) 2016 Cybozu
 *
 * Licensed under the MIT License
 *
 * Code based on Conditional Formatting Example Plugin
 */

/* TODO:
*   - display an error message if users try to map multiple source fields to same field
*/
jQuery.noConflict();

(function($, PLUGIN_ID) {
    'use strict';

    var CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
    // console.log(CONF);
    var MULTICHOICE_ROW_NUM = Number(CONF['multichoice_row_number']);
    var CHECKBOX_ROW_NUM = Number(CONF['checkbox_row_number']);
    for (var m = 1; m < MULTICHOICE_ROW_NUM + 1; m++) {
        CONF['multichoice_row' + m] = JSON.parse(CONF['multichoice_row' + m]);
    }
    for (var c = 1; c < CHECKBOX_ROW_NUM + 1; c++) {
        CONF['checkbox_row' + c] = JSON.parse(CONF['checkbox_row' + c]);
    }

    var multichoice_row_counter = MULTICHOICE_ROW_NUM || 1;
    var checkbox_row_counter = CHECKBOX_ROW_NUM || 1;

    $(document).ready(function() {
        var terms = {
            'en': {
                'cf_multichoice_title': 'Multi-choice Field Mappings',
                'cf_checkbox_title': 'Check Box Field Mappings',
                'cf_multichoice_column1': 'Lookup Field',
                'cf_multichoice_column2': 'Source Multi-choice Field',
                'cf_multichoice_column3': 'Mapped Multi-choice Field',
                'cf_checkbox_column1': 'Lookup Field',
                'cf_checkbox_column2': 'Source Check Box Field',
                'cf_checkbox_column3': 'Mapped Check Box Field',
                'cf_plugin_submit': '     Save   ',
                'cf_plugin_cancel': '  Cancel   ',
                'cf_required_field': 'Required field is empty.'
            }
        };

        // To switch the display by the login user's language (English display in the case of Chinese)
        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang] : terms['en'];

        var configHtml = $('#cf-plugin').html();
        var tmpl = $.templates(configHtml);
        $('div#cf-plugin').html(tmpl.render({'terms': i18n}));

        function escapeHtml(htmlstr) {
            return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function checkRowNumber() {
            if ($('#cf-plugin-multichoice-tbody > tr').length === 2) {
                $('#cf-plugin-multichoice-tbody > tr .removeList').eq(1).hide();
            } else {
                $('#cf-plugin-multichoice-tbody > tr .removeList').eq(1).show();
            }

            if ($('#cf-plugin-checkbox-tbody > tr').length === 2) {
                $('#cf-plugin-checkbox-tbody > tr .removeList').eq(1).hide();
            } else {
                $('#cf-plugin-checkbox-tbody > tr .removeList').eq(1).show();
            }
        }

        function setMultiChoiceDefaultC1C3() {
            for (var mi = 1; mi <= MULTICHOICE_ROW_NUM; mi++) {
                $('#cf-plugin-multichoice-tbody > tr').eq(0).clone(true).insertAfter(
                    $('#cf-plugin-multichoice-tbody > tr').eq(mi - 1)
                );
                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column1').attr('id', 'm' + mi);
                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column2').attr('id', 'source-m' + mi);
                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column1').val(CONF['multichoice_row' + mi]['lookup']);
                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column3').val(CONF['multichoice_row' + mi]['mapped']);
            }
        }

        function setMultiChoiceDefaultC2() {
            for (var mi = 1; mi <= MULTICHOICE_ROW_NUM; mi++) {
                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column2').val(CONF['multichoice_row' + mi]['source']);
            }
        }

        function setCheckBoxDefaultC1C3() {
            for (var ci = 1; ci <= CHECKBOX_ROW_NUM; ci++) {
                $('#cf-plugin-checkbox-tbody > tr').eq(0).clone(true).insertAfter(
                    $('#cf-plugin-checkbox-tbody > tr').eq(ci - 1)
                );
                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column1').attr('id', 'c' + ci);
                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column2').attr('id', 'source-c' + ci);
                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column1').val(CONF['checkbox_row' + ci]['lookup']);
                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column3').val(CONF['checkbox_row' + ci]['mapped']);
            }
        }

        function setCheckBoxDefaultC2() {
            for (var ci = 1; ci <= CHECKBOX_ROW_NUM; ci++) {
                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column2').val(CONF['checkbox_row' + ci]['source']);
            }
        }

        function setDefault() {
            if (MULTICHOICE_ROW_NUM > 0) {
                setMultiChoiceDefaultC1C3();
                setMultiChoiceDropdownC2().then( function() {
                    setMultiChoiceDefaultC2();
                });
            } else {
                // Insert Row
                var $newRow = $('#cf-plugin-multichoice-tbody > tr').eq(0).clone(true);
                $newRow.find('.cf-plugin-column1').attr('id', 'm1');
                $newRow.find('.cf-plugin-column2').attr('id', 'source-m1');
                $newRow.insertAfter($('#cf-plugin-multichoice-tbody > tr')).eq(0);
            }

            if (CHECKBOX_ROW_NUM > 0) {
                setCheckBoxDefaultC1C3();
                setCheckBoxDropdownC2().then( function() {
                    setCheckBoxDefaultC2();
                });
            } else {
                // Insert Row
                var $newRow = $('#cf-plugin-checkbox-tbody > tr').eq(0).clone(true);
                $newRow.find('.cf-plugin-column1').attr('id', 'c1');
                $newRow.find('.cf-plugin-column2').attr('id', 'source-c1');
                $newRow.insertAfter($('#cf-plugin-checkbox-tbody > tr')).eq(0);
            }
            checkRowNumber();
        }

        /* Sets dropdown for column 1 (lookup fields) and column 3 (mapped fields) */
        function setDropdownC1C3() {
            var param = {'app': kintone.app.getId()};
            kintone.api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', param, function(resp) {
                for (var key in resp.properties) {
                    if (!resp.properties.hasOwnProperty(key)) { continue; }
                    var field = resp.properties[key];
                    var $option = $('<option>');

                    if (field.lookup) {
                        $option.attr('value', escapeHtml(field.code));
                        $option.attr('name', escapeHtml(field.lookup.relatedApp.app));
                        $option.text(escapeHtml(field.label));
                        $('#cf-plugin-multichoice-tbody > tr:eq(0) .cf-plugin-column1').append($option.clone());
                        $('#cf-plugin-checkbox-tbody > tr:eq(0) .cf-plugin-column1').append($option.clone());
                    } else if (field.type === 'MULTI_SELECT') {
                        $option.attr('value', escapeHtml(field.code));
                        $option.text(escapeHtml(field.label));
                        $('#cf-plugin-multichoice-tbody > tr:eq(0) .cf-plugin-column3').append($option.clone());
                    } else if (field.type === 'CHECK_BOX') {
                        $option.attr('value', escapeHtml(field.code));
                        $option.text(escapeHtml(field.label));
                        $('#cf-plugin-checkbox-tbody > tr:eq(0) .cf-plugin-column3').append($option.clone());
                    }
                }
                setDefault();
            });
        }

        /* Sets dropdown for column 2 (source fields) in multi-choice table */
        function setMultiChoiceDropdownC2() {
            var chain = Promise.resolve();
            for (let mi = 1; mi <= MULTICHOICE_ROW_NUM; mi++) {
                chain = chain.then( function() {
                    let param = {'app': CONF['multichoice_row' + mi]['sourceApp']};
                    return kintone.api('/k/v1/app/form/fields', 'GET', param).then( function(resp) {
                        for (var key in resp.properties) {
                            if (!resp.properties.hasOwnProperty(key)) { continue; }
                            var field = resp.properties[key];
                            var $option = $('<option>');

                            if (field.type === 'MULTI_SELECT') {
                                $option.attr('value', escapeHtml(field.code));
                                $option.text(escapeHtml(field.label));
                                $('#cf-plugin-multichoice-tbody > tr:eq(' + mi + ') .cf-plugin-column2').append($option.clone());
                            }
                        }
                    });
                });
            }
            return chain;
        }

        /* Sets dropdown for column 2 (source fields) in check box table */
        function setCheckBoxDropdownC2() {
            var chain = Promise.resolve();
            for (let ci = 1; ci <= CHECKBOX_ROW_NUM; ci++) {
                chain = chain.then( function() {
                    let param = {'app': CONF['checkbox_row' + ci]['sourceApp']};
                    return kintone.api('/k/v1/app/form/fields', 'GET', param).then( function(resp) {
                        for (var key in resp.properties) {
                            if (!resp.properties.hasOwnProperty(key)) { continue; }
                            var field = resp.properties[key];
                            var $option = $('<option>');

                            if (field.type === 'CHECK_BOX') {
                                $option.attr('value', escapeHtml(field.code));
                                $option.text(escapeHtml(field.label));
                                $('#cf-plugin-checkbox-tbody > tr:eq(' + ci + ') .cf-plugin-column2').append($option.clone());
                            }
                        }
                    });
                });
            }
            return chain;
        }

        function updateDropdownC2(id, sourceApp, fieldType, htmlFieldType) {
            $('#source-' + id).find('option:gt(0)').remove();
            var param = {'app': sourceApp};
            kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', param, function(resp) {
                var fields = resp.properties;
                for (var key in fields) {
                    if (!fields.hasOwnProperty(key)) { continue; }
                    var field = fields[key];

                    if (field.type === fieldType) {
                        var $option = $('<option>');
                        $option.attr('value', escapeHtml(field.code));
                        $option.text(escapeHtml(field.label));
                        $('#source-' + id).append($option.clone());                    }
                }
            });
        }

        // Change source field dropdown
        $('.cf-plugin-column1').change(function() {
            var id  = $(this).attr('id');
            var sourceApp = $(this).find(':selected').attr('name');

            var fieldType, htmlFieldType;
            if (id.indexOf('m') !== -1) {
                fieldType = 'MULTI_SELECT';
                htmlFieldType = 'multichoice';
            } else if (id.indexOf('c') !== -1) {
                fieldType = 'CHECK_BOX';
                htmlFieldType = 'checkbox';
            }

            updateDropdownC2(id, sourceApp, fieldType, htmlFieldType);
            return true;
        });

        // Add multichoice row
        $('#cf-plugin-multichoice-tbody .addList').click(function() {
            multichoice_row_counter++;
            var $updatedClone = $('#cf-plugin-multichoice-tbody > tr').eq(0).clone(true);
            $updatedClone.find('.cf-plugin-column1').attr('id', 'm' + multichoice_row_counter);
            $updatedClone.find('.cf-plugin-column2').attr('id', 'source-m' + multichoice_row_counter);
            $updatedClone.insertAfter($(this).parent().parent());
            checkRowNumber();
        });

        // Add checkbox row
        $('#cf-plugin-checkbox-tbody .addList').click(function() {
            checkbox_row_counter++;
            var $updatedClone = $('#cf-plugin-checkbox-tbody > tr').eq(0).clone(true);
            $updatedClone.find('.cf-plugin-column1').attr('id', 'c' + checkbox_row_counter);
            $updatedClone.find('.cf-plugin-column2').attr('id', 'source-c' + checkbox_row_counter);
            $updatedClone.insertAfter($(this).parent().parent());
            checkRowNumber();
        });

        // Remove Row
        $('.removeList').click(function() {
            $(this).parent('td').parent('tr').remove();
            checkRowNumber();
        });

        // function createErrorMessage(type, error_num, row_num) {
        //     var user_lang = kintone.getLoginUser().language;
        //     var error_messages = {
        //         'en': {
        //             'multichoice': {
        //                 // '1': 'Required fields for Text Format Conditions row ' + row_num + ' are empty.',
        //                 // '2': 'Input "#000000 ~ #FFFFFF" for Font Color in Text Format Conditions row ' +
        //                 //         row_num + '.',
        //                 // '3': 'Input "#000000 ~ #FFFFFF" for Background Color in Text Format Conditions row ' +
        //                 //         row_num + '.',
        //                 // '4': 'Text Format Conditions row ' + row_num + ' includes HTML Characters.'
        //             },
        //             'checkbox': {
        //                 // '1': 'Required fields for Date Format Conditions row ' + row_num + ' are empty.',
        //                 // '2': 'Input integers for Value of Date Format Conditions row ' + row_num + '.',
        //                 // '3': 'Input integers for Value of Date Format Conditions row ' + row_num + '.',
        //                 // '4': 'Input "#000000 ~ #FFFFFF" for Font Color of Date Format Conditions row ' +
        //                 //         row_num + '.',
        //                 // '5': 'Input "#000000 ~ #FFFFFF" for Background Color of Date Format Conditions row ' +
        //                 //         row_num + '.',
        //                 // '6': 'Date Format Conditions row ' + row_num + ' includes HTML Characters.'
        //             }
        //         }
        //     };
        //     return error_messages[user_lang][type][error_num];
        // }

        // function checkConfigMultiChoiceValues(config) {
        //     var multichoice_row_num = Number(config['multichoice_row_number']);
        //     for (var cm = 1; cm <= multichoice_row_num; cm++) {
        //         var multichoice = JSON.parse(config['multichoice_row' + cm]);
        //         // if (!multichoice.field || !multichoice.type || !multichoice.targetfield) {
        //         //     throw new Error(createErrorMessage('multichoice', '1', cm));
        //         // }
        //         //
        //         // if (multichoice.targetcolor.slice(0, 1) !== '#') {
        //         //     throw new Error(createErrorMessage('multichoice', '2', cm));
        //         // }
        //         //
        //         // if (multichoice.targetcolor.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
        //         //     if (multichoice.targetcolor !== '#000000') {
        //         //         throw new Error(createErrorMessage('multichoice', '2', cm));
        //         //     }
        //         // }
        //         //
        //         // if (multichoice.targetbgcolor.slice(0, 1) !== '#') {
        //         //     throw new Error(createErrorMessage('multichoice', '3', cm));
        //         // }
        //         //
        //         // if (multichoice.targetbgcolor.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
        //         //     if (multichoice.targetbgcolor !== '#') {
        //         //         throw new Error(createErrorMessage('multichoice', '3', cm));
        //         //     }
        //         // }
        //         // if (multichoice.value.match(/&|<|>|"|'/g) !== null ||
        //         //     multichoice.targetcolor.match(/&|<|>|"|'/g) !== null ||
        //         //     multichoice.targetbgcolor.match(/&|<|>|"|'/g) !== null) {
        //         //     throw new Error(createErrorMessage('multichoice', '4', cm));
        //         // }
        //     }
        // }
        //
        // function checkConfigCheckBoxValues(config) {
        //     var checkbox_row_num = Number(config['checkbox_row_number']);
        //     for (var cc = 1; cc <= checkbox_row_num; cc++) {
        //         var checkbox = JSON.parse(config['checkbox_row' + cc]);
        //         // if (!checkbox.field || !checkbox.type || !checkbox.targetfield || !checkbox.value) {
        //         //     throw new Error(createErrorMessage('checkbox', '1', cc));
        //         // }
        //         // if (isNaN(checkbox.value)) {
        //         //     throw new Error(createErrorMessage('checkbox', '2', cc));
        //         // }
        //         // if (checkbox.value.indexOf('.') > -1) {
        //         //     throw new Error(createErrorMessage('checkbox', '3', cc));
        //         // }
        //         // if (checkbox.targetcolor.slice(0, 1) !== '#') {
        //         //     throw new Error(createErrorMessage('checkbox', '4', cc));
        //         // }
        //         // if (checkbox.targetcolor.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
        //         //     if (checkbox.targetcolor !== '#000000') {
        //         //         throw new Error(createErrorMessage('checkbox', '4', cc));
        //         //     }
        //         // }
        //         // if (checkbox.targetbgcolor.slice(0, 1) !== '#') {
        //         //     throw new Error(createErrorMessage('checkbox', '5', cc));
        //         // }
        //         // if (checkbox.targetbgcolor.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
        //         //     if (checkbox.targetbgcolor !== '#') {
        //         //         throw new Error(createErrorMessage('checkbox', '5', cc));
        //         //     }
        //         // }
        //         // if (checkbox.value.match(/&|<|>|"|'/g) !== null ||
        //         //     checkbox.targetcolor.match(/&|<|>|"|'/g) !== null ||
        //         //     checkbox.targetbgcolor.match(/&|<|>|"|'/g) !== null) {
        //         //     throw new Error(createErrorMessage('checkbox', '6', cc));
        //         // }
        //     }
        // }

        function getValues(type, num) {
            switch (type) {
                case 'multichoice':
                    return {
                        'lookup': $('#cf-plugin-multichoice-tbody > tr:eq(' + num + ') .cf-plugin-column1').val(),
                        'sourceApp' : $('#cf-plugin-multichoice-tbody > tr:eq(' + num + ') .cf-plugin-column1').find(':selected').attr('name'),
                        'source': $('#cf-plugin-multichoice-tbody > tr:eq(' + num + ') .cf-plugin-column2').val(),
                        'mapped': $('#cf-plugin-multichoice-tbody > tr:eq(' + num + ') .cf-plugin-column3').val()
                    };
                case 'checkbox':
                    return {
                        'lookup': $('#cf-plugin-checkbox-tbody > tr:eq(' + num + ') .cf-plugin-column1').val(),
                        'sourceApp': $('#cf-plugin-checkbox-tbody > tr:eq(' + num + ') .cf-plugin-column1').find(':selected').attr('name'),
                        'source': $('#cf-plugin-checkbox-tbody > tr:eq(' + num + ') .cf-plugin-column2').val(),
                        'mapped': $('#cf-plugin-checkbox-tbody > tr:eq(' + num + ') .cf-plugin-column3').val()
                    };
                default:
                    return '';
            }
        }

        function createConfig() {
            var config = {};

            // Assigning multichoice config settings
            var multichoice_row_num = $('#cf-plugin-multichoice-tbody > tr').length - 1;
            for (var cm = 1; cm <= multichoice_row_num; cm++) {
                var multichoice = getValues('multichoice', cm);
                if (multichoice.lookup === '' && multichoice.source === '' && multichoice.mapped === '') {
                    // Remove unnecessary row
                    $('#cf-plugin-multichoice-tbody > tr:eq(' + cm + ')').remove();
                    multichoice_row_num = multichoice_row_num - 1;
                    cm--;
                    continue;
                }
                config['multichoice_row' + cm] = JSON.stringify(multichoice);
            }
            config['multichoice_row_number'] = String(multichoice_row_num);

            // Assigning checkbox config settings
            var checkbox_row_num = $('#cf-plugin-checkbox-tbody > tr').length - 1;
            for (var cc = 1; cc <= checkbox_row_num; cc++) {
                var checkbox = getValues('checkbox', cc);
                if (checkbox.lookup === '' && checkbox.source === '' && checkbox.mapped === '') {
                    // Remove unnecessary row
                    $('#cf-plugin-checkbox-tbody > tr:eq(' + cc + ')').remove();
                    checkbox_row_num = checkbox_row_num - 1;
                    cc--;
                    continue;
                }
                config['checkbox_row' + cc] = JSON.stringify(checkbox);
            }
            config['checkbox_row_number'] = String(checkbox_row_num);

            return config;
        }

        // Save
        $('#cf-submit').click(function() {
            try {
                var config = createConfig();
                // checkConfigMultiChoiceValues(config);
                // checkConfigCheckBoxValues(config);
                kintone.plugin.app.setConfig(config);
            } catch (error) {
                alert(error.message);
            }
        });

        // Cancel
        $('#cf-cancel').click(function() {
            window.history.back();
        });
        setDropdownC1C3();
    });
})(jQuery, kintone.$PLUGIN_ID);
