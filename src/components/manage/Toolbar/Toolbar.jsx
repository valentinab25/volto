/**
 * Toolbar component.
 * @module components/manage/Toolbar/Toolbar
 */

import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { doesNodeContainClick } from 'semantic-ui-react/dist/commonjs/lib';
import cookie from 'react-cookie';
import { filter } from 'lodash';
import cx from 'classnames';
import {
  getTypes,
  listActions,
  setExpandedToolbar,
} from '@plone/volto/actions';
import { BodyClass, getBaseUrl } from '@plone/volto/helpers';

import { toolbar } from '~/config';

const messages = defineMessages({
  shrinkToolbar: {
    id: 'Shrink toolbar',
    defaultMessage: 'Shrink toolbar',
  },
});

/**
 * BasicToolbar container class.
 * @class BasicToolbar
 * @extends Component
 */
class BasicToolbarComponent extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    actions: PropTypes.shape({
      object: PropTypes.arrayOf(PropTypes.object),
      object_buttons: PropTypes.arrayOf(PropTypes.object),
      user: PropTypes.arrayOf(PropTypes.object),
    }),
    token: PropTypes.string,
    pathname: PropTypes.string.isRequired,
    content: PropTypes.shape({
      '@type': PropTypes.string,
      is_folderish: PropTypes.bool,
      review_state: PropTypes.string,
    }),
    getTypes: PropTypes.func.isRequired,
    types: PropTypes.arrayOf(
      PropTypes.shape({
        '@id': PropTypes.string,
        addable: PropTypes.bool,
        title: PropTypes.string,
      }),
    ),
    listActions: PropTypes.func.isRequired,
    inner: PropTypes.element.isRequired,
    hideDefaultViewButtons: PropTypes.bool,
  };

  /**
   * Default properties.
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    actions: null,
    token: null,
    content: null,
    hideDefaultViewButtons: false,
    types: [],
  };

  getCookieName = () =>
    `${this.props.name ? `${this.props.name}-` : ''}toolbar_expanded`;

  state = {
    expanded: cookie.load(this.getCookieName()) !== 'false',
    showMenu: false,
    menuStyle: {},
    menuComponents: [],
    loadedComponents: [],
    hideToolbarBody: false,
  };

  toolbarWindow = React.createRef();

  /**
   * Component will mount
   * @method componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.listActions(getBaseUrl(this.props.pathname));
    this.props.getTypes(getBaseUrl(this.props.pathname));
    this.props.setExpandedToolbar(this.state.expanded);
    document.addEventListener('mousedown', this.handleClickOutside, false);
  }

  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.pathname !== this.props.pathname) {
      this.props.listActions(getBaseUrl(nextProps.pathname));
      this.props.getTypes(getBaseUrl(nextProps.pathname));
    }
  }

  /**
   * Component will receive props
   * @method componentWillUnmount
   * @returns {undefined}
   */
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside, false);
  }

  handleShrink = () => {
    cookie.save(this.getCookieName(), !this.state.expanded, {
      expires: new Date((2 ** 31 - 1) * 1000),
      path: '/',
    });
    this.setState(
      (state) => ({ expanded: !state.expanded }),
      () => this.props.setExpandedToolbar(this.state.expanded),
    );
  };

  closeMenu = () =>
    this.setState(() => ({ showMenu: false, loadedComponents: [] }));

  loadComponent = (type) => {
    const { loadedComponents } = this.state;
    if (!this.state.loadedComponents.includes(type)) {
      this.setState({
        loadedComponents: [...loadedComponents, type],
        hideToolbarBody:
          toolbar.toolbarComponents[type].hideToolbarBody || false,
      });
    }
  };

  unloadComponent = () => {
    this.setState((state) => ({
      loadedComponents: state.loadedComponents.slice(0, -1),
      hideToolbarBody:
        toolbar.toolbarComponents[
          state.loadedComponents[state.loadedComponents.length - 2]
        ].hideToolbarBody || false,
    }));
  };

  toggleMenu = (e, selector, extras = []) => {
    if (this.state.showMenu) {
      this.closeMenu();
      return;
    }
    // PersonalTools always shows at bottom
    if (selector === 'personalTools') {
      this.setState((state) => ({
        showMenu: !state.showMenu,
        menuStyle: { bottom: 0 },
        extras,
      }));
    } else {
      this.setState((state) => ({
        showMenu: !state.showMenu,
        menuStyle: { top: 0, overflow: 'initial' },
        extras,
      }));
    }
    this.loadComponent(selector);
  };

  handleClickOutside = (e) => {
    if (this.pusher && doesNodeContainClick(this.pusher, e)) return;
    this.closeMenu();
  };

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { top = [], bottom = [] } = this.props;
    const { expanded } = this.state;

    return (
      this.props.token && (
        <>
          <BodyClass
            className={expanded ? 'has-toolbar' : 'has-toolbar-collapsed'}
          />
          <div
            style={this.state.menuStyle}
            className={
              this.state.showMenu ? 'toolbar-content show' : 'toolbar-content'
            }
            ref={this.toolbarWindow}
          >
            {this.state.showMenu && (
              // This sets the scroll locker in the body tag in mobile
              <BodyClass className="has-toolbar-menu-open" />
            )}
            <div
              className="pusher-puller"
              ref={(node) => (this.pusher = node)}
              style={{
                transform: this.toolbarWindow.current
                  ? `translateX(-${
                      (this.state.loadedComponents.length - 1) *
                      this.toolbarWindow.current.getBoundingClientRect().width
                    }px)`
                  : null,
              }}
            >
              {this.state.loadedComponents.map((component, index) =>
                (() => {
                  const ToolbarComponent =
                    toolbar.toolbarComponents[component].component;
                  const WrapperComponent =
                    toolbar.toolbarComponents[component].wrapper;
                  const haveActions =
                    toolbar.toolbarComponents[component].hideToolbarBody;
                  const title =
                    toolbar.toolbarComponents[component].wrapperTitle &&
                    this.props.intl.formatMessage(
                      toolbar.toolbarComponents[component].wrapperTitle,
                    );
                  if (WrapperComponent) {
                    return (
                      <WrapperComponent
                        componentName={component}
                        componentTitle={title}
                        pathname={this.props.pathname}
                        loadComponent={this.loadComponent}
                        unloadComponent={this.unloadComponent}
                        componentIndex={index}
                        theToolbar={this.toolbarWindow}
                        key={`personalToolsComponent-${index}`}
                        closeMenu={this.closeMenu}
                        hasActions={haveActions}
                        extras={this.state.extras}
                      >
                        <ToolbarComponent
                          pathname={this.props.pathname}
                          loadComponent={this.loadComponent}
                          unloadComponent={this.unloadComponent}
                          componentIndex={index}
                          theToolbar={this.toolbarWindow}
                          closeMenu={this.closeMenu}
                          extras={this.state.extras}
                          isToolbarEmbedded
                        />
                      </WrapperComponent>
                    );
                  } else {
                    return (
                      <ToolbarComponent
                        pathname={this.props.pathname}
                        loadComponent={this.loadComponent}
                        unloadComponent={this.unloadComponent}
                        componentIndex={index}
                        theToolbar={this.toolbarWindow}
                        key={`personalToolsComponent-${index}`}
                        closeMenu={this.closeMenu}
                        extras={this.state.extras}
                        content={
                          toolbar.toolbarComponents[component].contentAsProps
                            ? this.props.content
                            : null
                        }
                      />
                    );
                  }
                })(),
              )}
            </div>
          </div>
          <div className={this.state.expanded ? 'toolbar expanded' : 'toolbar'}>
            <div className="toolbar-body">
              <div className="toolbar-actions">
                {this.props.hideDefaultViewButtons && this.props.inner && (
                  <>{this.props.inner}</>
                )}
                {!this.props.hideDefaultViewButtons && (
                  <>
                    {top.map((ActionComponent, index) => (
                      <ActionComponent
                        {...this.props}
                        key={index}
                        toggleMenu={this.toggleMenu}
                      />
                    ))}
                  </>
                )}
              </div>
              <div className="toolbar-bottom">
                {bottom.map((BottomComponent, index) => (
                  <BottomComponent
                    {...this.props}
                    key={index}
                    toggleMenu={this.toggleMenu}
                  />
                ))}
              </div>
            </div>
            <div className="toolbar-handler">
              <button
                aria-label={this.props.intl.formatMessage(
                  messages.shrinkToolbar,
                )}
                className={cx({
                  [this.props.content?.review_state]: this.props.content
                    ?.review_state,
                })}
                onClick={this.handleShrink}
              />
            </div>
          </div>
          <div className="pusher" />
        </>
      )
    );
  }
}

export const BasicToolbar = compose(
  injectIntl,
  connect(
    (state, props) => ({
      actions: state.actions.actions,
      token: state.userSession.token,
      content: state.content.data,
      pathname: props.pathname,
      types: filter(state.types.types, 'addable'),
    }),
    { getTypes, listActions, setExpandedToolbar },
  ),
)(BasicToolbarComponent);

export default (props) => {
  const activity = toolbar.activities[props.activity || 'view'] || [];
  return <BasicToolbar {...props} {...activity}></BasicToolbar>;
};
