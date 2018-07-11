import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import NumericInput from 'react-numeric-input';

class Setting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gender: 'M',
      age: 20,
      partnerGender: 'F',
      partnerAgeFrom: 18,
      partnerAgeTo: 25,
      acceptTerms: false,
    }
  }

  handleGender(who, value) {
    let prevState = { ...this.state };
    if (who === 'user') {
      prevState.gender = value;
      this.setState(prevState);
    } else {
      prevState.partnerGender = value;
      this.setState(prevState);
    }
  }

  handleAge(who, value) {
    let prevState = { ...this.state };
    if (who === 'user') {
      prevState.age = value;
      this.setState(prevState);
    } else if (who === 'from') {
      prevState.partnerAgeFrom = value;
      this.setState(prevState);
    } else {
      prevState.partnerAgeTo = value;
      this.setState(prevState);
    }
  }

  handleAcceptTerms() {
    this.setState({
      acceptTerms: !this.state.acceptTerms,
    });
  }

  handleSubmit() {
    console.log(this.state);
  }

  render() {
    return (
      <div className="container">
        <h3>Setting</h3>
        <form>
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Personal Info</h3>
            </div>
            <div className="panel-body">
              <div className="form-group">
                <span><label htmlFor="frmAge">Display Name</label>&nbsp;
                <input type="text" className="form-control" placeholder="Name that show to other users" value={window.displayName} />
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="frmGender">Gender</label>
                <span>&nbsp;<input type="radio" name="frmGender" id="frmGender" checked={(this.state.gender === 'M')} onChange={this.handleGender.bind(this, 'user', 'M')} /> Male</span>
                <span>&nbsp;<input type="radio" name="frmGender" id="frmGender" checked={(this.state.gender === 'F')} onChange={this.handleGender.bind(this, 'user', 'F')} /> Female</span>
              </div>
              <div className="form-group">
                <span><label htmlFor="frmAge">Age</label>&nbsp;<NumericInput min={15} max={80} value={this.state.age} size={5} onChange={this.handleAge.bind(this, 'user')} /></span>
              </div>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Friend Filter</h3>
            </div>
            <div className="panel-body">
              <div className="form-group">
                <label htmlFor="frmGender">Gender</label>
                <span>&nbsp;<input type="radio" name="frmPartnerGender" id="frmPartnerGender" checked={this.state.partnerGender === 'M'} onChange={this.handleGender.bind(this, 'partner', 'M')} /> Male</span>
                <span>&nbsp;<input type="radio" name="frmPartnerGender" id="frmPartnerGender" checked={this.state.partnerGender === 'F'} onChange={this.handleGender.bind(this, 'partner', 'F')} /> Female</span>
              </div>
              <div className="form-group">
                <span><label htmlFor="frmPartnerAge">Age</label>&nbsp;
                <NumericInput
                    min={15}
                    max={this.state.partnerAgeTo}
                    size={5}
                    value={this.state.partnerAgeFrom}
                    onChange={this.handleAge.bind(this, 'from')} />
                  &nbsp;&nbsp;To&nbsp;&nbsp;
                <NumericInput
                    min={this.state.partnerAgeFrom}
                    max={80} size={5}
                    value={this.state.partnerAgeTo}
                    onChange={this.handleAge.bind(this, 'to')} /></span>
              </div>
            </div>
          </div>

          <div className="form-group form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="acceptTerms"
              checked={this.state.acceptTerms}
              onClick={this.handleAcceptTerms.bind(this)}
            />
            <label className="form-check-label" htmlFor="acceptTerms">&nbsp;Accept Terms & Conditions</label>
          </div>
          <button type="button" className="btn btn-primary" disabled={!this.state.acceptTerms} onClick={this.handleSubmit.bind(this)}>Submit</button>
        </form>
      </div>
    );
  }
}

export default Setting;
