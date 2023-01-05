import { createSlice } from '@reduxjs/toolkit'
import axiosInstance from "../../../utils/axiosConfig.js";
import { SOLAR_BANK, SOLAR_BANK_CODE } from '../../../utils/constants.js';
import { closeLoading, displayLoading } from './LoadingReducer.jsx';

const initialState = {
    src_account: {},
    banks: [],
    recipients: [],
    defaultRecipients: [],
    recipientsSolarBank:[],
    defaultRecipientsSolarBank:[],
    infoTransaction: {},
    infoDesAccount:{},
    transactionType:-1,
    transactionId: -1,
}

const transferReducer = createSlice({
    name: "transferReducer",
    initialState,
    reducers: {
        getUserBankAccount: (state, action) => {
            state.src_account = action.payload
        },
        getBankListExSLB: (state, action) => {
            const bankTemp = []
            const bankLists = action.payload
            bankLists.forEach(element => {
                if(element.bank_code !== SOLAR_BANK_CODE){
                    const temp = {}
                    temp["value"] = element.bank_code
                    temp["label"] = element.bank_name
                    bankTemp.push(temp)
                }
            });
            state.banks = bankTemp
        },
        getRecipientListExSLB: (state, action) => {
            const recipients = action.payload
            state.recipients = recipients.filter(item => item.bank_name !== SOLAR_BANK)
            state.defaultRecipients = recipients.filter(item => item.bank_name!==SOLAR_BANK)
        },
        getRecipientListBySolarBank: (state, action) => {
            const recipients = action.payload
            state.recipientsSolarBank = recipients.filter(item => item.bank_name === SOLAR_BANK)
            state.defaultRecipientsSolarBank = recipients.filter(item => item.bank_name === SOLAR_BANK)
        },
        searchReceiverIntra: (state, action) => {
            const textSearch = action.payload
            if (textSearch === "") {
                state.recipientsSolarBank = state.defaultRecipientsSolarBank
            } else {
                state.recipientsSolarBank = state.recipientsSolarBank.filter(item => item.account_number.trim().toLowerCase().includes(textSearch.trim().toLowerCase()))
            }
        },
        searchReceiverInter: (state, action) => {
            const textSearch = action.payload
            if (textSearch === "") {
                state.recipients = state.defaultRecipients
            } else {
                state.recipients = state.recipients.filter(item => item.account_number.trim().toLowerCase().includes(textSearch.trim().toLowerCase()))
            }
        },
        getInfoTransaction: (state, action) => {
            state.infoTransaction = action.payload
        },
        saveInfoTransactionAndDesAccount: (state,action)=>{
            const infoTransaction = action.payload
            const tempDesInfo = {
                full_name: infoTransaction.full_name,
                email:infoTransaction.email,
                phone:infoTransaction.phone,
                bank_code:infoTransaction.bank_code
            }
            state.transactionType = infoTransaction.transaction_type
            state.infoDesAccount = tempDesInfo
            state.infoTransaction = infoTransaction
        },
        confirmTransaction: (state, action) => {
            state.transactionId = action.payload
        }
    }
});

export const { searchReceiverIntra, searchReceiverInter,
                getUserBankAccount,
                saveInfoTransactionAndDesAccount,
                getRecipientListExSLB, getRecipientListBySolarBank,
                getInfoTransaction, confirmTransaction,
                getBankListExSLB
} = transferReducer.actions

export default transferReducer.reducer



// ----------- THUNK ----------------------
export const getUserBankAccountApi = (userId) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.get(`/customers/${userId}/bankaccount`)
            if (result.status === 200) {
                dispatch(getUserBankAccount(result.data.bankAccount))
            }
            dispatch(closeLoading())
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Can not get account_number")
        }
    }
}

export const getRecipientListBySolarBankApi = (userId) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.get(`/users/${userId}/recipients`)
            dispatch(getRecipientListBySolarBank(result.data))
            dispatch(closeLoading())
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Can not get recipient list")
        }
    }
}

export const getRecipientListExSLBApi = (userId) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.get(`/users/${userId}/recipients`)
            dispatch(getRecipientListExSLB(result.data))
            dispatch(closeLoading())
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Can not get recipient list")
        }
    }
}

// INTRABANK VALIDATION
export const getValidTransactionApi = (userId, infoTransaction, navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.post(`/customers/${userId}/intratransaction`, infoTransaction)
            if (result.status !== 200) {
                alert("Invalid Transaction Info")
            } else {
                dispatch(saveInfoTransactionAndDesAccount(result.data.infoTransaction))
                navigate("/customer/transfer/confirm")
            }
            dispatch(closeLoading())    
        } catch (err) {
            dispatch(closeLoading())  
            console.log(err)
            alert("Invalid Transaction Info")
        }
    }
}

// INTERBANK VALIDATION
export const getValidTransactionInterApi = (userId, infoTransaction, navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.post(`/customers/${userId}/intertransaction`, infoTransaction)
            dispatch(closeLoading())
            if (result.status !== 200) {
                alert("Invalid Transaction Info")
            } else {
                dispatch(saveInfoTransactionAndDesAccount(result.data.infoTransaction))
                navigate("/customer/transfer/confirm")
            }
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Invalid Transaction Info")
        }
    }
}

// USE FOR INTERBANK + INTRABANK
export const confirmTransactionApi = (userId, infoTransaction, navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.post(`/customers/${userId}/transaction/confirm`, infoTransaction)
            dispatch(closeLoading())
            if (result.status === 201) {
                dispatch(confirmTransaction(result.data.transactionId))
                navigate("/customer/transfer/otp",{replace:true})
            } else {
                alert("Invalid Transaction Info")
            }
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Invalid Transaction Info")
        }
    }
}

// INTRABANK OTP
export const getValidOtpApi = (transactionId, otpInfo, navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.post(`/customers/intratransaction/${transactionId}`, otpInfo)
            console.log(result)
            dispatch(closeLoading())
            if (result.status === 200) {
                dispatch(getInfoTransaction(result.data.infoTransaction))
                navigate("/customer/transfer/success",{replace:true})
            } else {
                alert("Invalid OTP Code or OTP Code expired")
            }
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Invalid OTP Code or OTP Code expired")
        }
    }
}

// INTERBANK OTP
export const getValidOtpInterApi = (transactionId, otpInfo, navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.post(`/customers/intertransaction/${transactionId}`, otpInfo)
            console.log(result)
            dispatch(closeLoading())
            if (result.status === 200) {
                dispatch(getInfoTransaction(result.data.infoTransaction))
                navigate("/customer/transfer/success",{replace:true})
            } else {
                alert("Invalid OTP Code or OTP Code expired")
            }
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Invalid OTP Code or OTP Code expired")
        }
    }
}

export const getBankListExSLBApi = () => {
    return async dispatch => {
        dispatch(displayLoading())
        try {
            const result = await axiosInstance.get("/banks")
            dispatch(closeLoading())
            if (result.status === 200) {
                dispatch(getBankListExSLB(result.data.bankList))
            }
        } catch (err) {
            dispatch(closeLoading())
            console.log(err)
            alert("Can not get Bank List")
        }
    }
}

export const saveRecipientApi = (infoRecipient,navigate) => {
    return async dispatch => {
        dispatch(displayLoading())
        try{
            const result = await axiosInstance.post("/customers/save",infoRecipient)
            console.log(result)
            dispatch(closeLoading())
            if(result.status === 200){
                alert("Save successfully!")
                navigate("/customer",{replace:true})
            }
        }catch(err){
            dispatch(closeLoading())
            console.log(err)
            alert("This account can't be save. Something wrong")
        }
    }
}