/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedBills from "../__mocks__/store.js"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then, bills should be displayed", async () => {
      const onNavigate = (pathname) =>{
        document.body.innerHTML = ROUTES({pathname})
      }
      const billsMock = new Bills({document, onNavigate, store: store, localStorage: window.localStorage})
      const fetchedBills = await billsMock.getBills()
      document.body.innerHTML = BillsUI({data: bills})
      expect(fetchedBills.length).toBe(4)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then it should have a new Bill button", () => {
      const newBillBtn = screen.getByTestId('btn-new-bill')
      expect(newBillBtn.classList.contains('btn')).toBeTruthy()
    })
  })
  describe('When i click on New Bill button', ()=>{
    test("Then, it should redirect to add new bill page", () => {
      const onNavigate = (pathname) =>{
        document.body.innerHTML = ROUTES({pathname})
      }
      const billsMock = new Bills ({document, onNavigate, store: null, localStorage: window.localStorage})
      document.body.innerHTML = BillsUI({data : bills})
      const buttonNewBill = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn((e) =>
        billsMock.handleClickNewBill(e)
      )
      buttonNewBill.addEventListener("click", handleClickNewBill)
      fireEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()

    })
  })
  describe('When i click on icon eyes', () => {
    test('Then, it should open modal', async () => {
      document.body.innerHTML = BillsUI({data: bills})
      const billsMockList = new Bills({document, onNavigate, store: null, localStorage: window.localStorage})
      $.fn.modal = jest.fn()
      const iconEyes = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(() => billsMockList.handleClickIconEye(iconEyes))
      iconEyes.addEventListener("click", handleClickIconEye)
      fireEvent.click(iconEyes)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getByText("Justificatif")).toBeTruthy()
    })
  })

})

// test d'intégration GET
describe("Given i am a user connected as Employee", () => {
  describe("When i am on bills page", () => {
    test("Fetches bills from mock API GET", async () => {
      const spy = jest.spyOn(mockedBills, 'bills')
      const bills = await mockedBills.bills()
      expect(spy).toHaveBeenCalled()
    })
  })
  describe("When an error occurs on API", () => {
    jest.spyOn(mockedBills, "bills")
    Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a"
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
  })
  test("fetches bills from an API and fails with 404 message error", async () => {

    mockedBills.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 404"))
        }
      }})
    window.onNavigate(ROUTES_PATH.Bills)
    document.body.innerHTML = BillsUI({error : "Erreur 404"})
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test("fetches messages from an API and fails with 500 message error", async () => {

    mockedBills.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 500"))
        }
      }})

    window.onNavigate(ROUTES_PATH.Bills)
    document.body.innerHTML = BillsUI({error : "Erreur 500"})
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})