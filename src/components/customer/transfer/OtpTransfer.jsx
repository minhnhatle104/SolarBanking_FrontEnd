import { useFormik } from 'formik';
import moment from 'moment/moment';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import * as Yup from "yup"

export default function OtpTransfer() {
    const transactionId = useSelector(state => state.transferReducer.transactionId)

    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            otpCode: "",
        },
        validationSchema: Yup.object().shape({
            otpCode: Yup.string().matches(/^[0-9]+$/, "Must be only digits")
                .min(6, "Must be exactly 6 Digits").max(6, "Must be exactly 6 Digits")
                .required("Required"),
        }),
        onSubmit: values => {
            const otpInfo = { ...values, created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss") }
            console.log(otpInfo)
        }
    })
    useEffect(() => {
        const interval = setInterval(() => {
            if (seconds > 0) {
                setSeconds(seconds - 1);
            }

            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(interval);
                } else {
                    setSeconds(59);
                    setMinutes(minutes - 1);
                }
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [seconds]);

    return (
        <div className="page-body">
            <div className="card">
                <div className="card-header" >
                    <h1 style={{ fontFamily: "Jost" }}>OTP Required</h1>
                </div>
                <div className="card-body">
                    <h5 className="card-title" style={{ fontFamily: "Jost" }}>Kindly enter the OTP code which sent to your
                        provided email.</h5>
                    <form onSubmit={formik.handleSubmit}>
                        <div className="form-group">
                            <input type="text" name='otpCode' className="form-control" placeholder="OTP Code" onChange={formik.handleChange} />
                            {formik.errors.otpCode ? <div className='text-danger'>{formik.errors.otpCode}</div> : null}
                        </div>
                        <div className="form-group">
                            <div className="d-flex justify-content-between ml-4">
                                {seconds > 0 || minutes > 0 ? (
                                    <p className="time-remaining">
                                        Time Remaining:
                                        <span className="time-counter">
                                            {minutes < 10 ? ` 0${minutes}` : minutes}:
                                            {seconds < 10 ? `0${seconds}` : seconds}
                                        </span>
                                    </p>
                                ) : (
                                    <p className="time-remaining">Didn't receive code?</p>
                                )}
                                {seconds > 0 || minutes > 0 ? (
                                    <div className="resend-otp-link-disabled mr-5">
                                        <span>Resend OTP?</span>
                                    </div>
                                ) : (
                                    <div className="resend-otp-link-active mr-5">
                                        <span>Resend OTP?</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success" onClick={formik.handleSubmit}>Confirm</button>
                    </form>
                </div>
            </div>
        </div>
    )
}



