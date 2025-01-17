// @flow
import React, { Fragment } from 'react';
import { isNameValid } from 'lbry-redux';
import { FormField } from 'component/common/form';
import BusyIndicator from 'component/common/busy-indicator';
import Button from 'component/button';
import { CHANNEL_NEW, CHANNEL_ANONYMOUS } from 'constants/claim';

type Props = {
  channel: string, // currently selected channel
  channels: ?Array<{ name: string }>,
  balance: number,
  onChannelChange: string => void,
  createChannel: (string, number) => Promise<any>,
  fetchChannelListMine: () => void,
  fetchingChannels: boolean,
};

type State = {
  newChannelName: string,
  newChannelBid: number,
  addingChannel: boolean,
  creatingChannel: boolean,
  newChannelNameError: string,
  newChannelBidError: string,
  createChannelError: ?string,
};

class ChannelSection extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      newChannelName: '',
      newChannelBid: 0.1,
      addingChannel: false,
      creatingChannel: false,
      newChannelNameError: '',
      newChannelBidError: '',
      createChannelError: undefined,
    };

    (this: any).handleChannelChange = this.handleChannelChange.bind(this);
    (this: any).handleNewChannelNameChange = this.handleNewChannelNameChange.bind(this);
    (this: any).handleNewChannelBidChange = this.handleNewChannelBidChange.bind(this);
    (this: any).handleCreateChannelClick = this.handleCreateChannelClick.bind(this);
  }

  componentDidMount() {
    const { channels, fetchChannelListMine, fetchingChannels } = this.props;
    if ((!channels || !channels.length) && !fetchingChannels) {
      fetchChannelListMine();
    }
  }

  handleChannelChange(event: SyntheticInputEvent<*>) {
    const { onChannelChange } = this.props;
    const { newChannelBid } = this.state;
    const channel = event.target.value;

    if (channel === CHANNEL_NEW) {
      this.setState({ addingChannel: true });
      onChannelChange(channel);
      this.handleNewChannelBidChange(newChannelBid);
    } else {
      this.setState({ addingChannel: false });
      onChannelChange(channel);
    }
  }

  handleNewChannelNameChange(event: SyntheticInputEvent<*>) {
    let newChannelName = event.target.value;

    if (newChannelName.startsWith('@')) {
      newChannelName = newChannelName.slice(1);
    }

    let newChannelNameError;
    if (newChannelName.length > 0 && !isNameValid(newChannelName, false)) {
      newChannelNameError = __('LBRY names cannot contain spaces or reserved symbols ($#@;/"<>%{}|^~[]`)');
    }

    this.setState({
      newChannelNameError,
      newChannelName,
    });
  }

  handleNewChannelBidChange(newChannelBid: number) {
    const { balance } = this.props;
    let newChannelBidError;
    if (newChannelBid === 0) {
      newChannelBidError = __('Your deposit cannot be 0');
    } else if (newChannelBid === balance) {
      newChannelBidError = __('Please decrease your deposit to account for transaction fees');
    } else if (newChannelBid > balance) {
      newChannelBidError = __('Deposit cannot be higher than your balance');
    }

    this.setState({
      newChannelBid,
      newChannelBidError,
    });
  }

  handleCreateChannelClick() {
    const { balance, createChannel, onChannelChange } = this.props;
    const { newChannelBid, newChannelName } = this.state;

    const channelName = `@${newChannelName.trim()}`;

    if (newChannelBid > balance) {
      return;
    }

    this.setState({
      creatingChannel: true,
      createChannelError: undefined,
    });

    const success = () => {
      this.setState({
        creatingChannel: false,
        addingChannel: false,
      });

      onChannelChange(channelName);
    };

    const failure = () => {
      this.setState({
        creatingChannel: false,
        createChannelError: __('Unable to create channel due to an internal error.'),
      });
    };

    createChannel(channelName, newChannelBid).then(success, failure);
  }

  render() {
    const channel = this.state.addingChannel ? 'new' : this.props.channel;
    const { fetchingChannels, channels = [] } = this.props;
    const {
      newChannelName,
      newChannelNameError,
      newChannelBid,
      newChannelBidError,
      creatingChannel,
      createChannelError,
      addingChannel,
    } = this.state;

    return (
      <Fragment>
        {createChannelError && <div className="error-text">{createChannelError}</div>}
        {fetchingChannels ? (
          <BusyIndicator message="Updating channels" />
        ) : (
          <fieldset-section>
            <FormField
              name="channel"
              label={__('Channel')}
              type="select"
              onChange={this.handleChannelChange}
              value={channel}
            >
              <option value={CHANNEL_ANONYMOUS}>{__('Anonymous')}</option>
              {channels &&
                channels.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              <option value={CHANNEL_NEW}>{__('New channel...')}</option>
            </FormField>
          </fieldset-section>
        )}
        {addingChannel && (
          <div>
            <FormField
              label={__('Name')}
              name="channel-input"
              type="text"
              placeholder={__('myChannelName')}
              error={newChannelNameError}
              value={newChannelName}
              onChange={this.handleNewChannelNameChange}
            />

            <FormField
              className="form-field--price-amount"
              name="channel-deposit"
              label={__('Deposit (LBC)')}
              step="any"
              min="0"
              type="number"
              helper={__('This LBC remains yours. It is a deposit to reserve the name and can be undone at any time.')}
              error={newChannelBidError}
              value={newChannelBid}
              onChange={event => this.handleNewChannelBidChange(parseFloat(event.target.value))}
            />

            <div className="card__actions">
              <Button
                button="primary"
                label={!creatingChannel ? __('Create channel') : __('Creating channel...')}
                onClick={this.handleCreateChannelClick}
                disabled={
                  !newChannelName || !newChannelBid || creatingChannel || newChannelNameError || newChannelBidError
                }
              />
            </div>
          </div>
        )}
      </Fragment>
    );
  }
}

export default ChannelSection;
