from sqlalchemy.orm import Session

from app.models import Prediction


def get_all_predictions(
    db: Session,
    limit: int = 50,
    risk_level: str | None = None,
):
    """
    Return the most recent saved predictions with optional risk_level filter.
    """
    query = db.query(Prediction)

    if risk_level and risk_level.strip() and risk_level.strip().lower() != "all":
        query = query.filter(
            Prediction.risk_level.ilike(f"%{risk_level.strip()}%")
        )

    predictions = (
        query.order_by(
            Prediction.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return predictions


def get_prediction_by_id(
    db: Session,
    prediction_id: int
):
    """
    Return one prediction by database ID.
    """

    return (
        db.query(Prediction)
        .filter(
            Prediction.id == prediction_id
        )
        .first()
    )