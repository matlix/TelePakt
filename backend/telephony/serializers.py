"""Serializery DRF dla REST API aplikacji mobilnej TelePakt."""
from rest_framework import serializers
from .models import LegalScript, CallLog, UkeComplaint, CustomerReview

class LegalScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalScript
        fields = '__all__'

class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'

class UkeComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = UkeComplaint
        fields = '__all__'

class CustomerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerReview
        fields = '__all__'
