import React, { Component } from 'react';

class Menu extends Component {
  render() {
    return (
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a className="nav-link active" href="/">Home</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="/setting">Setting</a>
        </li>
        <li className="nav-item">
          <a className="nav-link disabled" href="/">Explore</a>
        </li>
        <li className="nav-item">
          <a className="nav-link disabled" href="/">Friends</a>
        </li>
      </ul>
    );
  }
}

export default Menu;
