import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

import { SalaryFormData, occupationsMap, rankMap, baseSalary, nszzCutPercentage, florianCutPercentage } from './salary-form.config';

const formatNumber = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-salary-form',
  templateUrl: './salary-form.component.html',
  styleUrls: ['./salary-form.component.scss']
})
export class SalaryFormComponent implements OnInit {
  readonly FORM_DATA_LS_KEY = 'PFSC-FORMDATA';

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
  occupation: { quantifier: number, name: string, group: number };
  baseSalary = baseSalary;
  base: number;
  rankMoney: number;
  dutyYearsPercentageBonus: number;
  dutyYearsBonus: number;
  brutto: number;
  nszzCut: number;
  florianCut: number;
  nszzCutPercentage = nszzCutPercentage;
  florianCutPercentage = florianCutPercentage;
  tax: number;

  constructor() { }

  ngOnInit(): void {
    this.loadFormData();
  }

  onSubmit() {
    const hub = occupationsMap.find(hubData => hubData.hub === this.formData.hub);
    const occupation = hub.map.find(occupationData => occupationData.name === this.formData.occupation);
    this.occupation = occupation;
    this.base = Math.round(occupation.quantifier * baseSalary / 10) * 10; // round to 10pln

    const startDate = moment(this.formData.dutyStart);
    const endDate = moment(Date.now());
    const dutyYears = endDate.diff(startDate, 'years');

    this.dutyYearsPercentageBonus = this.countDutyYearsBonusPercentage(dutyYears);
    this.dutyYearsBonus = formatNumber(this.dutyYearsPercentageBonus / 100 * this.base);

    const rank = rankMap.find(rankData => rankData.name === this.formData.rank);
    this.rankMoney = rank.value;

    this.brutto = this.base + this.dutyYearsBonus + this.rankMoney + this.formData.serviceAllowance + this.formData.functionalAllowance;
    this.nszzCut = this.formData.nszz
      ? formatNumber(nszzCutPercentage * this.brutto / 100)
      : 0;
    this.florianCut = this.formData.florian
      ? formatNumber(florianCutPercentage * this.brutto / 100)
      : 0;
    
    this.tax = this.formData.taxFree ? 0 : formatNumber(0.17 * this.brutto);

    this.salary = formatNumber(this.brutto - this.tax - this.florianCut - this.nszzCut - this.formData.additions);

    this.saveFormData();
  }

  getOccupations(): string[] {
    if (!this.formData.hub) { return []; }
    const currentMap = occupationsMap.find(map => map.hub === this.formData.hub);
    return currentMap.map.map(data => data.name);
  }

  private countDutyYearsBonusPercentage(years: number): number {
    if (years >= 35) { return 35; }
    if (years >= 32) { return 32; }
    if (years < 2) { return 0; }
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
    return formatNumber((base + rankMoney) * multiplier);
  }

  public resetOccupation(): void {
    this.formData.occupation = null;
  }

  public toggleAllowances(): void {
    this.chosenServiceAllowance = !this.chosenServiceAllowance;
    this.formData.functionalAllowance = 0;
    this.formData.serviceAllowance = 0;
  }

  private saveFormData(): void {
    const stringified = JSON.stringify(this.formData);
    localStorage.setItem(this.FORM_DATA_LS_KEY, stringified);
  }

  private loadFormData(): void {
    const data = localStorage.getItem(this.FORM_DATA_LS_KEY);
    if (!data){ return; }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      return;
    }
    this.formData = parsed;
  }

}
