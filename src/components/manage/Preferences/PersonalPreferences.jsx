/**
 * Personal preferences component.
 * @module components/manage/Preferences/PersonalPreferences
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { updateIntl } from 'react-intl-redux';
import { map, keys } from 'lodash';
import cookie from 'react-cookie';
import request from 'superagent';
import { defineMessages, injectIntl } from 'react-intl';

import { Form, Toast } from '@plone/volto/components';
import languages from '@plone/volto/constants/Languages';

import loadable from '@loadable/component';
const LibReactToastify = loadable.lib(() => import('react-toastify'));

const messages = defineMessages({
  personalPreferences: {
    id: 'Personal Preferences',
    defaultMessage: 'Personal Preferences',
  },
  default: {
    id: 'Default',
    defaultMessage: 'Default',
  },
  language: {
    id: 'Language',
    defaultMessage: 'Language',
  },
  languageDescription: {
    id: 'Your preferred language',
    defaultMessage: 'Your preferred language',
  },
  saved: {
    id: 'Changes saved',
    defaultMessage: 'Changes saved',
  },
  back: {
    id: 'Back',
    defaultMessage: 'Back',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
});

/**
 * PersonalPreferences class.
 * @class PersonalPreferences
 * @extends Component
 */
class PersonalPreferences extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    updateIntl: PropTypes.func.isRequired,
    closeMenu: PropTypes.func.isRequired,
  };

  /**
   * Constructor
   * @method constructor
   * @param {Object} props Component properties
   * @constructs PersonalPreferences
   */
  constructor(props) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  libReactToastifyRef = React.createRef();

  /**
   * Submit handler
   * @method onSubmit
   * @param {object} data Form data.
   * @returns {undefined}
   */
  onSubmit(data) {
    cookie.save('I18N_LANGUAGE', data.language || '', {
      expires: new Date((2 ** 31 - 1) * 1000),
      path: '/',
    });
    request('GET', `/assets/locales/${data.language || 'en'}.json`).then(
      (locale) => {
        this.props.updateIntl({
          locale: locale.language || 'en',
          messages: locale.body,
        });
        this.libReactToastifyRef.current.toast.success(
          <Toast
            success
            title={this.props.intl.formatMessage(messages.success)}
            content={this.props.intl.formatMessage(messages.saved)}
          />,
        );
      },
    );
    this.libReactToastifyRef.current.toast.success(
      <Toast success title={this.props.intl.formatMessage(messages.saved)} />,
    );
    this.props.closeMenu();
  }

  /**
   * Cancel handler
   * @method onCancel
   * @returns {undefined}
   */
  onCancel() {
    this.props.closeMenu();
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    return (
      <Form
        formData={{ language: cookie.load('I18N_LANGUAGE') || '' }}
        schema={{
          fieldsets: [
            {
              id: 'default',
              title: this.props.intl.formatMessage(messages.default),
              fields: ['language'],
            },
          ],
          properties: {
            language: {
              description: this.props.intl.formatMessage(
                messages.languageDescription,
              ),
              title: this.props.intl.formatMessage(messages.language),
              type: 'string',
              choices: map(keys(languages), (lang) => [lang, languages[lang]]),
            },
          },
          required: [],
        }}
        onSubmit={this.onSubmit}
        onCancel={this.onCancel}
      >
        <LibReactToastify ref={this.libReactToastifyRef} />
      </Form>
    );
  }
}

export default compose(
  injectIntl,
  connect(null, { updateIntl }),
)(PersonalPreferences);
