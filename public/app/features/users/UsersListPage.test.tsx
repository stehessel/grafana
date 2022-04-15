import { shallow } from 'enzyme';
import React from 'react';
import { mockToolkitActionCreator } from 'test/core/redux/mocks';

import { NavModel } from '@grafana/data';
import { Invitee, OrgUser } from 'app/types';

import { Props, UsersListPage } from './UsersListPage';

// import { getMockUser } from './__mocks__/userMocks';


import { setUsersSearchPage, setUsersSearchQuery } from './state/reducers';

jest.mock('../../core/app_events', () => ({
  emit: jest.fn(),
}));

const setup = (propOverrides?: object) => {
  const props: Props = {
    navModel: {
      main: {
        text: 'Configuration',
      },
      node: {
        text: 'Users',
      },
    } as NavModel,
    users: [] as OrgUser[],
    invitees: [] as Invitee[],
    searchQuery: '',
    searchPage: 1,
    externalUserMngInfo: '',
    fetchInvitees: jest.fn(),
    loadUsers: jest.fn(),
    updateUser: jest.fn(),
    removeUser: jest.fn(),
    setUsersSearchQuery: mockToolkitActionCreator(setUsersSearchQuery),
    setUsersSearchPage: mockToolkitActionCreator(setUsersSearchPage),
    hasFetched: false,
  };

  Object.assign(props, propOverrides);

  const wrapper = shallow(<UsersListPage {...props} />);
  const instance = wrapper.instance() as UsersListPage;

  return {
    wrapper,
    instance,
  };
};

describe('Render', () => {
  it('should render component', () => {
    const { wrapper } = setup();

    expect(wrapper).toMatchSnapshot();
  });

  it('should render List page', () => {
    const { wrapper } = setup({
      hasFetched: true,
    });

    expect(wrapper).toMatchSnapshot();
  });
});
