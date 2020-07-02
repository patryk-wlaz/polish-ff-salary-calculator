import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

import { SalaryFormData, occupationsMap, rankMap, baseSalary } from './salary-form.config';

@Component({
  selector: 'app-salary-form',
  templateUrl: './salary-form.component.html',
  styleUrls: ['./salary-form.component.scss']
})
export class SalaryFormComponent implements OnInit {
  formData: SalaryFormData = {
    hub: null,
    occupation: null,
    rank: null,
    serviceAllowance: 0,
    dutyStart: null,
  };
  hubs = occupationsMap.map(data => data.hub);
  ranks = rankMap.map(data => data.name);
  salary = 0;

  constructor() { }

  ngOnInit(): void {}

  onSubmit() {
    const hub = occupationsMap.find(hubData => hubData.hub === this.formData.hub);
    const occupation = hub.map.find(occupationData => occupationData.name === this.formData.occupation);
    const base = Math.round(occupation.quantifier * baseSalary / 10) * 10; // round to 10pln

    const startDate = moment(this.formData.dutyStart);
    const endDate = moment(Date.now());
    const dutyYears = endDate.diff(startDate, 'years');
    const dutyYearsBonus = this.countDutyYearsBonusPercentage(dutyYears) / 100 * base;

    const rank = rankMap.find(rankData => rankData.name === this.formData.rank);
    const rankMoney = rank.value;

    const brutto = base + dutyYearsBonus + rankMoney + this.formData.serviceAllowance;
    this.salary = 0.83 * brutto;
  }

  getOccupations(): string[] {
    if (!this.formData.hub) { return []; }
    const currentMap = occupationsMap.find(map => map.hub === this.formData.hub);
    return currentMap.map.map(data => data.name);
  }

  private countDutyYearsBonusPercentage(years: number): number {
    const overTwenty = years - 20;
    return overTwenty <= 0
      ? years
      : years + Math.floor(overTwenty / 2);
  }

}
