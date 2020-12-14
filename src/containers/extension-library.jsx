import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratchhw-vm';

import {compose} from 'redux';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    extensionUrl: {
        defaultMessage: 'Enter the URL of the extension',
        description: 'Prompt for unoffical extension url',
        id: 'gui.extensionLibrary.extensionUrl'
    },
    legoTag: {
        id: 'gui.library.lego',
        defaultMessage: 'Lego',
        description: 'Lego tag to filter all lego libraries.'
    }
});

const LEGO_TAG = {tag: 'lego', intlLabel: messages.legoTag};
const tagListPrefix = [LEGO_TAG];

class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'updateDeviceExtensions',
            'handleItemSelect'
        ]);
        this.state = {
            deviceExtensions: []
        };
    }

    componentDidMount () {
        if (this.props.deviceId) {
            this.updateDeviceExtensions();
        }
    }

    updateDeviceExtensions () {
        // Todo exclude the same item.
        this.props.vm.extensionManager.getLocalDeviceExtensionsList()
            .then(data => this.setState({deviceExtensions: data}));
        this.props.vm.extensionManager.getRemoteDeviceExtensionsList()
            .then(data => this.setState({deviceExtensions: data}));
    }

    handleItemSelect (item) {
        const id = item.extensionId;

        if (this.props.deviceId) {
            if (id && !item.disabled) {
                if (this.props.vm.extensionManager.isDeviceExtensionLoaded(id)) {
                    this.props.vm.extensionManager.unloadDeviceExtension(id).then(() => {
                        this.updateDeviceExtensions();
                    });
                } else {
                    this.props.vm.extensionManager.loadDeviceExtension(id).then(() => {
                        this.updateDeviceExtensions();
                    })
                        .catch(err => {
                        // TODO add a alet device extension load failed. and change the state to bar to failed state
                            console.log(`err = ${err}`); // eslint-disable-line no-console
                        });
                }
            }
        } else {
            let url = item.extensionURL ? item.extensionURL : id;
            if (!item.disabled && !id) {
                // eslint-disable-next-line no-alert
                url = prompt(this.props.intl.formatMessage(messages.extensionUrl));
            }
            if (id && !item.disabled) {
                if (this.props.vm.extensionManager.isExtensionLoaded(url)) {
                    this.props.onCategorySelected(id);
                } else {
                    this.props.vm.extensionManager.loadExtensionURL(url).then(() => {
                        this.props.onCategorySelected(id);
                    });
                }
            }
        }
    }
    render () {
        let extensionLibraryThumbnailData = [];

        if (this.props.deviceId) {
            extensionLibraryThumbnailData = this.state.deviceExtensions.filter(
                extension => extension.supportDevice.includes(this.props.deviceId)).map(extension => ({
                rawURL: extension.iconURL || extensionIcon,
                ...extension
            }));
        } else {
            extensionLibraryThumbnailData = extensionLibraryContent.map(extension => ({
                rawURL: extension.iconURL || extensionIcon,
                ...extension
            }));
        }

        return (
            <LibraryComponent
                autoClose={!this.props.deviceId}
                data={extensionLibraryThumbnailData}
                filterable
                tags={tagListPrefix}
                id="extensionLibrary"
                isUnloadble={!!this.props.deviceId}
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    deviceId: PropTypes.string,
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

const mapStateToProps = state => ({
    deviceId: state.scratchGui.device.deviceId
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps
    )
)(ExtensionLibrary);
