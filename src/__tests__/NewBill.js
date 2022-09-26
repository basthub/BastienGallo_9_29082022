/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedBills from "../__mocks__/store.js"
import router from "../app/Router.js";
import Store from "../app/Store.js";
import store from "../__mocks__/store.js";
import BillsUI from "../views/BillsUI.js";

const onNavigate = ((pathname) => {
  document.body.innerHTML = ROUTES({pathname})
})
beforeEach(() =>{
  document.body.innerHTML = NewBillUI()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then envelope icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains('active-icon')).toBeTruthy()
    })
    it("Should display a form", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
    test("Form should have 9 inputs", () => {
      expect(screen.getByTestId('form-new-bill').length).toEqual(9)
    })
  
    describe("When user submit a file", () => {
      test("Then, it should be detected", () => {
        const newBill = new NewBill({document, onNavigate, store: Store, localStorage : window.localStorage})
        const handleChangeFileMock = jest.fn(newBill.handleChangeFile)
        const testFile = screen.getByTestId('file')
        testFile.addEventListener("change", handleChangeFileMock)
        fireEvent.change(testFile, {
          target : {
            files : [new File(["test.jpg"], "test.jpg", {type : "image/jpg"})]
          }
        })
        expect(handleChangeFileMock).toHaveBeenCalled()   
      })
      describe("When user submit a file in wrong format", () => {
        test('Then, it should cancel the file', () => {
          const newBill = new NewBill({document, onNavigate, store : Store, localStorage: window.localStorage})
          const handleChangeFileMock = jest.fn(newBill.handleChangeFileMock)
          const testFile = screen.getByTestId('file')
          testFile.addEventListener("change", handleChangeFileMock)
          fireEvent.change(testFile, {
            target : {
              files : [new File (["wrongformat.txt"], "wrongformat.txt", {type: "text/txt"})]
            }
          })
          expect(handleChangeFileMock).toHaveBeenCalled()
          expect(testFile.value).toBe('')
        })
        test('Then, it should display an error message', () => {
          const newBill = new NewBill({document, onNavigate, store : Store, localStorage: window.localStorage})
          const handleChangeFileMock = jest.fn(newBill.handleChangeFileMock)
          const testFile = screen.getByTestId('file')
          testFile.addEventListener("change", handleChangeFileMock)
          fireEvent.change(testFile, {
            target : {
              files : [new File (["wrongfileformat.txt"], "wrongfileformat.txt", {type: "text/txt"})]
            }
          })
          expect(handleChangeFileMock).toHaveBeenCalled()
          expect(screen.getByTestId('error-format')).toBeTruthy()
        })
      })
    })
  })
})
//test d'intégration POST
describe("Given I am an user connected as an employee", () =>{
  describe("When I navigate on NewBill page", () => {
    describe("When I submit a form correctly completed", () => {
      test("Then, a new Bill should be created", async () => {
        Object.defineProperty(window, "localStorage", {value : localStorageMock})
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
        )
        const newBill = new NewBill({document, onNavigate, store: store, localStorage: window.localStorage})
        const handleSubmitMock = jest.fn(newBill.handleSubmit)
        const submitForm = screen.getByTestId('form-new-bill')
        submitForm.addEventListener('submit', handleSubmitMock)
        fireEvent.submit(submitForm)
        expect(handleSubmitMock).toBeCalledTimes(1)
       // expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })
    })
    test("Then, it should be send to back end", async () => {
      const validBillMock = {
        name: "testValid",
        email: "a@a",
        type: "Services en ligne",
        vat: "100",
        pct: 100,
        commentAdmin: "test send valid bill",
        amount: 300,
        status: "accepted",
        date: "2003-03-03",
        commentary: "",
        fileName: "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.png",
        fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3"
      } 
      const postSpy = jest.spyOn(mockedBills, 'bills')
      const bills = await mockedBills.bills().update(validBillMock)
      expect(postSpy).toHaveBeenCalled()
      expect(bills.id).toBe('47qAXb6fIm2zOKkLzMro')
    })
    describe("When an error occurs on API", () => {
      it("Return a 404 error", async() => {
        mockedBills.bills.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        document.body.innerHTML = BillsUI({error: "Erreur 404"})
        expect(await screen.getByText(/Erreur 404/)).toBeTruthy()
      })
      it("Return a 500 error", async() => {
        mockedBills.bills.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        document.body.innerHTML = BillsUI({error: "Erreur 500"})
        expect(await screen.getByText(/Erreur 500/)).toBeTruthy()
      })
    })
  })
})