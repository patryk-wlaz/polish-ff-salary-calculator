import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

import { SalaryFormData, occupationsMap, rankMap, baseSalary, nszzCutPercentage, florianCutPercentage } from './salary-form.config';

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
    functionalAllowance: 0,
    dutyStart: null,
    additions: 0,
    nszz: false,
    florian: false,
    taxFree: false,
  };
  hubs = occupationsMap.map(data => data.hub);
  ranks = rankMap.map(data => data.name);
  salary = 0;

  chosenServiceAllowance = true;

  displayedInfo: string;

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

    const brutto = base + dutyYearsBonus + rankMoney + this.formData.serviceAllowance + this.formData.functionalAllowance;
    const nszzCut = this.formData.nszz
      ? nszzCutPercentage * brutto / 100
      : 0;
    const florianCut = this.formData.florian
      ? florianCutPercentage * brutto / 100
      : 0;
    
    const taxMultiplier = this.formData.taxFree ? 1 : 0.83;

    this.salary = taxMultiplier * brutto - florianCut - nszzCut - this.formData.additions;
  }

  getOccupations(): string[] {
    if (!this.formData.hub) { return []; }
    const currentMap = occupationsMap.find(map => map.hub === this.formData.hub);
    return currentMap.map.map(data => data.name);
  }

  private countDutyYearsBonusPercentage(years: number): number {
    if (years >= 35) { return 35; }
    if (years >= 32) { return 32; }
    const yearsOverTwenty = years - 20;
    return yearsOverTwenty <= 0
      ? years
      : 20 + Math.floor(yearsOverTwenty / 2) * 2;
  }

  public onInfotipClick(type: string): void {
    this.displayedInfo = type;
  }

  public calculateMaxAllowance(functional = false): number {
    if (!this.formData.hub || !this.formData.occupation || !this.formData.rank) { return 0; }
    const hub = occupationsMap.find(hubData => hubData.hub === this.formData.hub);
    const occupation = hub.map.find(occupationData => occupationData.name === this.formData.occupation);

    const base = Math.round(occupation.quantifier * baseSalary / 10) * 10; // round to 10pln
    const rank = rankMap.find(rankData => rankData.name === this.formData.rank);
    const rankMoney = rank.value;

    const multiplier = functional ? 7/10 : 1/2;
    return (base + rankMoney) * multiplier;
  }

  public resetOccupation(): void {
    this.formData.occupation = null;
  }

  public toggleAllowances(): void {
    this.chosenServiceAllowance = !this.chosenServiceAllowance;
    this.formData.functionalAllowance = 0;
    this.formData.serviceAllowance = 0;
  }

}
