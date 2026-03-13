use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_status: Option<bool>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None, session_status: None }
    }

    pub fn fail(message: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(message.into()), session_status: None }
    }

    pub fn fail_with_session(message: impl Into<String>, session_valid: bool) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
            session_status: Some(session_valid),
        }
    }

    pub fn session_passed(session_valid: bool) -> Self {
        Self {
            success: session_valid,
            data: None,
            error: None,
            session_status: Some(session_valid),
        }
    }
}