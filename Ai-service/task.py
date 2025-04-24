from app.services import service1, service2, service3

class Tool1:
    def execute(self, input_data):
        """
        Tool1 description - calls Service1 endpoint
        """
        # Add any preprocessing if needed
        result = service1.call_service1(input_data)
        return result

class Tool2:
    def execute(self, input_data):
        """
        Tool2 description - calls Service2 endpoint
        """
        # Add any preprocessing if needed
        result = service2.call_service2(input_data)
        return result

class Tool3:
    def execute(self, input_data):
        """
        Tool3 description - calls Service3 endpoint
        """
        # Add any preprocessing if needed
        result = service3.call_service3(input_data)
        return result